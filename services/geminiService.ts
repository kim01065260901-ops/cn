
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardConfig, AnalysisResult, AspectRatio, SceneDetail } from "../types";

export const analyzeScript = async (config: StoryboardConfig): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const charCount = config.script.length;
  const estimatedMinutes = Math.max(0.5, charCount / 450); 

  let targetCount = config.targetSceneCount || 0;
  if (targetCount === 0) {
    // 02번 항목의 밀도 설정을 기반으로 자동 계산
    switch (config.sceneDetail) {
      case SceneDetail.ESSENTIAL: 
        targetCount = Math.max(2, Math.ceil(estimatedMinutes * 2)); 
        break;
      case SceneDetail.DETAILED: 
        targetCount = Math.ceil(estimatedMinutes * 15); 
        break;
      default: 
        targetCount = Math.max(2, Math.ceil((charCount / 1000) * 4)); 
        break;
    }
  }
  const finalTargetCount = Math.min(50, Math.max(2, Math.round(targetCount)));

  const textPrompt = `
    # ROLE: Master Visual Director & Storyboard Artist
    # TASK: Split the provided script into EXACTLY ${finalTargetCount} distinct visual scenes.
    # DIRECTING STYLE:
    - Base Art Style: ${config.style}
    - Screen Ratio: ${config.aspectRatio}
    - Character Continuity: Maintain features for "${config.mainCharacter || 'the protagonist'}".
    
    # CONSTRAINTS:
    - You must distribute the script evenly across exactly ${finalTargetCount} scenes.
    - Each scene must have a unique, vivid cinematic description.
    - provide "videoPromptEn" (English) for the image AI.
    - provide "videoPromptKo" (Korean) for the production staff.

    # SCRIPT:
    ${config.script}

    # OUTPUT SCHEMA (JSON):
    {
      "scenes": [
        {
          "scriptSegment": "The specific line from the script",
          "videoPromptEn": "Detailed cinematic visual prompt in English",
          "videoPromptKo": "한글 연출 및 구도 설명"
        }
      ],
      "characterDescription": "Concise physical description to maintain character consistency",
      "globalStyleGuide": "Core artistic keywords to maintain the ${config.style} look across all frames"
    }
  `;

  const parts: any[] = [{ text: textPrompt }];
  if (config.styleImage) parts.push({ inlineData: { mimeType: "image/jpeg", data: config.styleImage.split(',')[1] } });
  if (config.characterImage) parts.push({ inlineData: { mimeType: "image/jpeg", data: config.characterImage.split(',')[1] } });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scriptSegment: { type: Type.STRING },
                videoPromptEn: { type: Type.STRING },
                videoPromptKo: { type: Type.STRING }
              },
              required: ["scriptSegment", "videoPromptEn", "videoPromptKo"]
            }
          },
          characterDescription: { type: Type.STRING },
          globalStyleGuide: { type: Type.STRING }
        },
        required: ["scenes", "characterDescription", "globalStyleGuide"]
      }
    }
  });

  const parsed = JSON.parse(response.text.trim());
  return {
    ...parsed,
    scenes: parsed.scenes.slice(0, finalTargetCount)
  };
};

export const generateSceneImage = async (
  prompt: string, 
  styleGuide: string, 
  charDesc: string, 
  aspectRatio: AspectRatio,
  styleImage?: string,
  characterImage?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const instruction = `High-end video storyboard frame. Style: ${styleGuide}. Scene: ${prompt}. Consistent Character: ${charDesc}. Professional cinematic lighting, detailed textures, masterwork quality.`;
  
  const parts: any[] = [{ text: instruction }];
  if (styleImage) parts.push({ inlineData: { mimeType: "image/jpeg", data: styleImage.split(',')[1] } });
  if (characterImage) parts.push({ inlineData: { mimeType: "image/jpeg", data: characterImage.split(',')[1] } });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: aspectRatio as any } }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Generation Failed");
};
