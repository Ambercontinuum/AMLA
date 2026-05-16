# AMLA

Adaptive Multimodal Learning Agent

AMLA is a research prototype for context-aware technical tutoring. It combines a multimodal chat interface with a lightweight local context analyzer, then uses Gemini function calling to adjust response style before producing help.

Status: public working prototype. This repository is intended to show the architecture, interaction loop, and implementation direction; it is not presented as a finished production deployment.

## What It Does

- Accepts text plus image, PDF, video, or code attachments.
- Runs a local context analysis pass before the model response.
- Routes the response style through support levels such as `HIGH_SUPPORT_NEEDED`, `GUIDANCE_REQUIRED`, `DEBUG_ASSISTANCE`, and `TECHNICAL_ACCELERATION`.
- Renders Markdown, code blocks, and model-provided JSON visualizations.
- Keeps the interface focused on learning context instead of generic chat.

## Architecture

AMLA has three main layers:

- `App.tsx`: React interface, file attachment flow, chat state, and session context panel.
- `utils/chandraAnalysis.ts`: local context analyzer used as the grounding tool.
- `services/geminiService.ts`: Gemini request flow with tool-calling and response adaptation.

The project is related to the broader CHANDRA/SERAPH design family, but this repo is scoped to the adaptive learning assistant interface.

## Run Locally

Prerequisite: Node.js.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` and add your Gemini API key:

   ```bash
   GEMINI_API_KEY=your_key_here
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Vite.

## Notes

The code-block preview control is intentionally a local UI simulation. It does not execute arbitrary code in the browser. Real sandboxed execution should be added as a separate, isolated service before presenting AMLA as an execution environment.

Generated from an AI Studio prototype and polished into a public research artifact by Amber Anson with AI-assisted implementation support.
