
export type CampaignGoal = 'unboxing' | 'problem_solution' | 'lifestyle' | 'hard_sell';
export type TargetPlatform = 'tiktok' | 'reels' | 'shorts';
export type VideoDuration = '15s' | '30s' | '60s';
export type VoiceStyle = 'casual' | 'professional' | 'excited' | 'humorous';

export interface ProductAnalysis {
  name: string;
  brand: string;
  keyFeatures: string[];
  sellingPoints: string[];
  targetAudience: string;
  painPointsSolved: string[];
  viralAngle: string;
  toneRecommendation: string;
}

export interface UGCScene {
  voice_over: string;
  tempo: string;
  camera_settings: string;
  visual_action: string;
}

export interface UGCPrompt {
  hook: string;
  body: string;
  cta: string;
  scenes: UGCScene[];
}

export enum AspectRatio {
  RATIO_1_1 = '1:1',
  RATIO_9_16 = '9:16',
  RATIO_16_9 = '16:9'
}

export interface AppState {
  step: 'input' | 'analysis' | 'prompt' | 'image';
  url: string;
  apiKey: string;
  campaignGoal: CampaignGoal;
  platform: TargetPlatform;
  duration: VideoDuration;
  voiceStyle: VoiceStyle;
  language: 'en' | 'id';
  analysis?: ProductAnalysis;
  ugcPrompt?: UGCPrompt;
  coverImage?: string;
  referenceImage?: string;
  characterImage?: string;
  coverInstruction?: string;
  loading: boolean;
  error?: string;
}
