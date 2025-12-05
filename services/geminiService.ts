import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper to init AI
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Image Analysis using gemini-3-pro-preview (High quality vision)
export const identifyCreature = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      species: { type: Type.STRING, description: "Common name of the animal or bird." },
      scientificName: { type: Type.STRING, description: "Scientific Latin name." },
      confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." },
      description: { type: Type.STRING, description: "A brief visual description of the animal in the image." },
      habitat: { type: Type.STRING, description: "Typical habitat for this species." },
    },
    required: ["species", "scientificName", "confidence", "description", "habitat"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: "Identify the animal or bird in this picture clearly. If it is not an animal/bird, return 'Unknown' for species.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an expert zoologist. Identify species accurately.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Identification failed", error);
    throw error;
  }
};

// 2. Fast Captioning using gemini-2.5-flash-lite-latest (Low latency)
export const generateQuickCaption = async (species: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest",
      contents: `Write a very short, witty, or cute caption (max 10 words) for a photo of a ${species}.`,
    });
    return response.text?.trim() || `A lovely ${species}`;
  } catch (error) {
    return `Look, a ${species}!`;
  }
};

// 3. Deep Dive Info using gemini-2.5-flash with Google Search (Grounding)
export const getSpeciesDetails = async (species: string): Promise<{ summary: string; url?: string }> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find a brief, interesting educational summary about the ${species}. Focus on conservation status or unique behaviors.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract grounding metadata for links
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let url = "";
    if (chunks && chunks.length > 0) {
      // Try to find a valid web URL
      const webChunk = chunks.find((c: any) => c.web?.uri);
      if (webChunk) {
        url = webChunk.web.uri;
      }
    }

    return {
      summary: response.text || "Information currently unavailable.",
      url: url,
    };
  } catch (error) {
    console.error("Search failed", error);
    return { summary: "Could not fetch online details." };
  }
};