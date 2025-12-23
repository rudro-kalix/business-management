import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBusinessData = async (
  transactions: Transaction[], 
  query: string
): Promise<string> => {
  try {
    const dataContext = JSON.stringify(transactions.slice(-50)); // Limit context to last 50 transactions for efficiency
    
    const prompt = `
      You are an expert business analyst for a digital subscription reseller business (selling ChatGPT accounts).
      
      The business model includes:
      1. Base Subscription Cost (costPrice)
      2. Gmail Account Cost (gmailCost) - Buying email accounts to create subscriptions.
      3. Marketing Costs (fbAdCost, posterCost) - Facebook ads and poster marketing allocated per sale (CPA).
      
      Here is the recent transaction data in JSON format:
      ${dataContext}
      
      User Query: ${query}
      
      Please analyze the data and provide a helpful, professional, and actionable response. 
      If the user asks for insights, look for trends in "Net Profit" (Sale Price - All Costs).
      Identify if marketing costs (FB/Poster) are eating into margins too much.
      Keep the response concise and formatted with Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No analysis could be generated at this time.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm having trouble connecting to the analysis engine right now. Please check your API key or try again later.";
  }
};

export const forecastSales = async (transactions: Transaction[]): Promise<string> => {
    try {
        const dataContext = JSON.stringify(transactions);
        const prompt = `
            Based on the following sales history, predict the trend for the next month.
            Identify which "PlanType" is most profitable after deducting all costs (gmail, fb ads, posters).
            Suggest if they should spend more on FB Ads or Posters based on the data provided (if correlations exist).
            Data: ${dataContext}
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 } // Use a small thinking budget for better reasoning
            }
        });

        return response.text || "Forecasting unavailable.";
    } catch (error) {
        console.error("Forecast error", error);
        return "Could not generate forecast.";
    }
}