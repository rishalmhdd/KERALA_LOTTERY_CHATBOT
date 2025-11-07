import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function askAi(query, lang = "EN") {
  try {
    const systemPrompt =
      lang === "ML"
        ? `നിങ്ങൾ കേരള സംസ്ഥാന ലോട്ടറി സഹായിയാണ്.
നിങ്ങൾ ലോട്ടറി സംബന്ധിച്ച ഔദ്യോഗിക വിവരങ്ങൾ മാത്രം നൽകണം.
ഉറപ്പില്ലെങ്കിൽ ഈ സന്ദേശം നൽകുക:
"കൃത്യമായ വിവരങ്ങൾക്ക് ഔദ്യോഗിക കേരള ലോട്ടറി ഓഫീസുമായി ബന്ധപ്പെടുക."`
        : `You are Kerala State Lottery Support Assistant.
Answer ONLY Kerala lottery related official questions.
If unsure, reply with:
"Please contact Kerala Lottery Office for accurate information."`;

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", // ✅ new Groq model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Error → ", error);
    return lang === "ML"
      ? "⚠️ സിസ്റ്റം തിരക്കിലാണ്, ദയവായി ശ്രമിക്കൂ."
      : "⚠️ System busy, please try again.";
  }
}
