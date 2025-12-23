import { Transaction } from "../types";

let aiClient: Awaited<ReturnType<typeof createClient>> | null = null;

const resolveApiKey = () => {
  return (
    (typeof process !== "undefined" && process.env?.API_KEY) ||
    (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
    import.meta.env?.VITE_GEMINI_API_KEY ||
    ""
  );
};

const createClient = async () => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error("Missing Gemini API key.");
  }

  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey });
};

const getClient = async () => {
  if (!aiClient) {
    aiClient = await createClient();
  }
  return aiClient;
};

export const analyzeBusinessData = async (
  transactions: Transaction[], 
  query: string
): Promise<string> => {
  try {
    const ai = await getClient();
    const dataContext = JSON.stringify(transactions.slice(-50)); // Limit context to last 50 transactions
    
    // Note: In a real app we would pass expenses here too, but for now we focus on sales data
    // or we can mock a summary of expenses if needed, but the prompt should be aware of the business model.
    const prompt = `
      You are an expert business analyst for a digital subscription reseller business (selling ChatGPT accounts).
      
      The business model:
      - Revenue comes from selling subscriptions (Transactions).
      - Costs are split into:
        1. COGS (Base Cost per subscription).
        2. OpEx (Total Expenses for Gmail accounts, Facebook Ads, Posters).
      - The currency is **Bangladeshi Taka (BDT)**. All numerical values are in BDT.
      
      Here is the recent SALES transaction data:
      ${dataContext}
      
      User Query: ${query}
      
      Please analyze the data. If the user asks about profit, remind them that Net Profit = (Revenue - COGS) - Total Expenses.
      Look for trends in sales volume and gross margins.
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
        const ai = await getClient();
        const dataContext = JSON.stringify(transactions);
        const prompt = `
            Based on the following sales history, predict the trend for the next month.
            The currency is **Bangladeshi Taka (BDT)**.
            Identify which "PlanType" is selling the most.
            Suggest if they should increase marketing spend based on sales velocity (more sales usually justifies higher ad spend).
            Data: ${dataContext}
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 }
            }
        });

        return response.text || "Forecasting unavailable.";
    } catch (error) {
        console.error("Forecast error", error);
        return "Could not generate forecast.";
    }
}
