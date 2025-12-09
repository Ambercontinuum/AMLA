
import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { Attachment, Message } from "../types";
import { analyze_context, ContextAnalysis } from "../utils/chandraAnalysis";

// Initialize the GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-pro-preview';

// Define the Tool
const analyzeContextTool: FunctionDeclaration = {
  name: "analyze_learning_context",
  description: "Analyzes the user's input text to determine learning context, sentiment, and technical needs. Returns a status code and support level.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      text_content: {
        type: Type.STRING,
        description: "The full text content provided by the user to analyze."
      }
    },
    required: ["text_content"]
  }
};

const tools: Tool[] = [
  { functionDeclarations: [analyzeContextTool] }
];

export interface ServiceResponse {
  text: string;
  analysis: ContextAnalysis | null;
}

/**
 * Prepares the content for the API call, combining text and base64 encoded files.
 * Handles the Function Calling loop (Model -> Tool -> Model).
 */
export const sendMessageToGemini = async (
  messages: Message[], 
  currentInput: string,
  currentAttachments: Attachment[]
): Promise<ServiceResponse> => {
  
  let capturedAnalysis: ContextAnalysis | null = null;

  // 1. Construct History
  const historyParts: any[] = messages
    .filter(m => m.id !== 'welcome') 
    .map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

  // 2. Prepare Current Message
  const currentParts: any[] = [];
  
  currentAttachments.forEach((att) => {
    currentParts.push({
      inlineData: {
        mimeType: att.mimeType,
        data: att.base64Data,
      },
    });
  });

  if (currentInput) {
    currentParts.push({ text: currentInput });
  }

  const fullContents = [
    ...historyParts,
    { role: 'user', parts: currentParts }
  ];

  // 3. System Instruction
  const systemInstruction = `You are AMLA (Adaptive Multimodal Learning Agent). 
  You are an expert software engineer and data scientist.
  
  CRITICAL PROTOCOL:
  For any input containing a file, code, or a question, you MUST FIRST CALL the analyze_learning_context function. 
  DO NOT rely on natural language inference alone; use the tool's status_code and support_level to guide your tone.

  CONFLICT EVALUATION PROTOCOL (The Override):
  After receiving the analysis tool result, compare it with the complexity of the user's current prompt.
  
  IF (status_code indicates technical proficiency, e.g., "TECHNICAL_ACCELERATION" or "STANDARD_FLOW") AND (User prompt is simple, vague, or foundational):
      DO NOT execute the technical plan immediately.
      Instead, ask this exact clarifying question:
      "Based on your technical background markers, the analysis suggests a high-velocity approach. However, your question is fundamental. To ensure I don't give you a generic answer, should I:
      
      A. Beginner Track: Start with a simple, slow-paced tutorial?
      B. Advanced Track: Proceed with the high-velocity, technical roadmap?"

  Response Strategy based on Analysis (If no conflict):
  - If status_code is "HIGH_SUPPORT_NEEDED" or "GUIDANCE_REQUIRED": Adopt a patient, step-by-step teaching style. Explain concepts simply before showing code.
  - If status_code is "DEBUG_ASSISTANCE": Validate the issue, then move directly to troubleshooting.
  - If status_code is "TECHNICAL_ACCELERATION" or "STANDARD_FLOW": Be concise, technical, and high-velocity.
  
  General Guidelines:
  1. formatting: Use Markdown. specific syntax for code blocks: \`\`\`language ... \`\`\`.
  2. If data implies a visualization, provide a JSON block wrapped in \`\`\`json\`\`\` for the frontend:
     {
       "visualization": {
         "type": "bar" | "line",
         "title": "Chart Title",
         "xKey": "name",
         "yKey": "value",
         "data": [{"name": "A", "value": 10}, ...]
       }
     }
  3. Be concise but helpful. 
  `;

  try {
    // FIRST CALL: Send input to model
    const result1 = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: fullContents,
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
        temperature: 0.2, 
      }
    });

    const firstResponse = result1;
    const candidates = firstResponse.candidates;

    if (!candidates || candidates.length === 0) {
      return { text: firstResponse.text || "", analysis: null };
    }

    const firstPart = candidates[0].content.parts[0];

    // CHECK FOR FUNCTION CALL
    if (firstPart.functionCall) {
      const functionCall = firstPart.functionCall;
      
      if (functionCall.name === 'analyze_learning_context') {
        console.log("AMLA: Executing analyze_learning_context...");
        
        const args = functionCall.args as any;
        const textToAnalyze = args.text_content || currentInput; 
        
        // Execute locally
        capturedAnalysis = analyze_context(textToAnalyze);
        console.log("AMLA: Analysis result:", capturedAnalysis);

        const functionResponsePart = {
          functionResponse: {
            name: 'analyze_learning_context',
            response: { result: capturedAnalysis }
          }
        };

        // SECOND CALL: Send tool result back
        const toolFollowUpContents = [
          ...fullContents,
          { role: 'model', parts: [firstPart] },
          { role: 'user', parts: [functionResponsePart] }
        ];

        const finalResult = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: toolFollowUpContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.4, 
          }
        });

        return { 
          text: finalResult.text || "", 
          analysis: capturedAnalysis 
        };
      }
    }

    return { 
      text: firstResponse.text || "", 
      analysis: null 
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
