import { GoogleGenAI, Type } from "@google/genai";
import { NutrientData } from "../types";

// Schema for structured output
const foodAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    foodName: {
      type: Type.STRING,
      description: "A concise name of the identified food in Traditional Chinese.",
    },
    calories: {
      type: Type.INTEGER,
      description: "Estimated total calories (kcal).",
    },
    protein: {
      type: Type.INTEGER,
      description: "Estimated protein in grams.",
    },
    carbs: {
      type: Type.INTEGER,
      description: "Estimated carbohydrates in grams.",
    },
    fat: {
      type: Type.INTEGER,
      description: "Estimated fat in grams.",
    },
    confidence: {
      type: Type.STRING,
      description: "High, Medium, or Low confidence in the estimation.",
    }
  },
  required: ["foodName", "calories", "protein", "carbs", "fat"],
};

export const analyzeFoodWithGemini = async (
  promptText: string,
  imageBase64?: string
): Promise<{ name: string } & NutrientData> => {
  
  // Initialize AI client here to ensure env vars are loaded
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";
  const parts: any[] = [];

  // Add Image if available
  if (imageBase64) {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    parts.push({
      inlineData: {
        mimeType: "image/jpeg", // Assuming JPEG for simplicity, can detect from header
        data: base64Data,
      },
    });
  }

  // Add Text Prompt
  const prompt = `
    你是一位專業的營養師。請分析這張圖片或這段文字描述中的食物。
    請盡可能準確地估算一份（或是描述中指定的份量）的熱量與三大營養素。
    如果是組合餐點，請估算總和。
    請以繁體中文回答食物名稱。
    
    使用者描述/備註: ${promptText || "無"}
  `;
  
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
        systemInstruction: "You are a helpful nutrition assistant. Always analyze conservatively but realistically. Return JSON only.",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    const data = JSON.parse(jsonText);

    return {
      name: data.foodName,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("無法分析食物，請稍後再試或手動輸入。");
  }
};