
import { GoogleGenAI, Type } from "@google/genai";
import { PillCountResult } from "../types.ts";

export const analyzePillCount = async (base64Image: string, expectedMedName: string): Promise<PillCountResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Analyze this image of medications. 
            1. Count the number of individual pills visible on the tray.
            2. Verify if they match the visual characteristics of "${expectedMedName}".
            Return a JSON object with properties: count (integer), confidence (0-1), identifiedMedication (string), warning (string, if mismatch).`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            count: { 
              type: Type.INTEGER,
              description: 'The number of pills counted in the image.'
            },
            confidence: { 
              type: Type.NUMBER,
              description: 'Confidence score of the count and identification.'
            },
            identifiedMedication: { 
              type: Type.STRING,
              description: 'The name of the medication identified based on visual appearance.'
            },
            warning: { 
              type: Type.STRING,
              description: 'A warning message if the medication does not match the expected description.'
            },
          },
          required: ["count", "confidence"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const result = JSON.parse(text);
    return result as PillCountResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
