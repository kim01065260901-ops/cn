
export enum AspectRatio {
  NINE_SIXTEEN = '9:16',
  SIXTEEN_NINE = '16:9',
  THREE_FOUR = '3:4',
  FOUR_THREE = '4:3',
  ONE_ONE = '1:1'
}

export enum SceneDetail {
  ESSENTIAL = 'essential',
  STANDARD = 'standard',
  DETAILED = 'detailed'
}

export interface StoryboardScene {
  id: string;
  scriptSegment: string;
  videoPromptEn: string;
  videoPromptKo: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface StoryboardConfig {
  style: string;
  aspectRatio: AspectRatio;
  script: string;
  sceneDetail: SceneDetail;
  targetSceneCount?: number;
  mainCharacter?: string;
  styleImage?: string;
  characterImage?: string;
  cameraMovement?: string;
  lightingMood?: string;
}

export interface AnalysisResult {
  scenes: {
    scriptSegment: string;
    videoPromptEn: string;
    videoPromptKo: string;
  }[];
  characterDescription: string;
  globalStyleGuide: string;
}
