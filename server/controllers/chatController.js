import fs from "fs";
import Session from "../models/Session.js";
import { STATES } from "../flows/states.js";
import { reply } from "../utils/reply.js";
import { checkTicket } from "../services/ticket.service.js";
import { saveComplaint } from "../services/complaint.service.js";
import { getAgentsByDistrict } from "../services/agent.service.js";
import { validateEmail } from "../flows/validations.js";
import { askAi } from "../services/ai.service.js";

// load English + Malayalam menus
const menuEN = JSON.parse(fs.readFileSync("./flows/menu.json", "utf-8"));
const menuML = JSON.parse(fs.readFileSync("./flows/menu.ml.json", "utf-8"));

// data files
const latestResult = JSON.parse(fs.readFileSync("./data/latestResult.json", "utf-8"));
const fullResults = JSON.parse(fs.readFileSync("./data/fullResults.json", "utf-8"));
const prizeClaim = JSON.parse(fs.readFileSync("./data/prizeClaim.json", "utf-8"));
const contactInfo = JSON.parse(fs.readFileSync("./data/contactInfo.json", "utf-8"));
const faqData = JSON.parse(fs.readFileSync("./data/faq.json", "utf-8"));

function getMenu(lang) {
  return lang === "ML" ? menuML : menuEN;
}

function generateRef() {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,"");
  return `KSL-${d}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}

// static FAQ match
function findFaqMatch(text) {
  text = text.toLowerCase();
  for (let f of faqData.faqs) {
    if (text.includes(f.q.toLowerCase().slice(0, 6))) return f.a;
  }
  return null;
}

export const processMessage = async (req, res) => {
  const { sessionId, message } = req.body;

  // ✅ keep raw text for AI & FAQ match
  const rawText = message?.trim() || "";
  const text = rawText.toUpperCase();

  let session = await Session.findOne({ sessionId });
  if (!session) {
    session = await Session.create({ sessionId, state: STATES.MENU, language: "EN" });
    return res.json(reply(menuEN.welcome, menuEN.menu));
  }

  const menu = getMenu(session.language);

  // ✅ language menu
  if (text === "LANGUAGE") {
    return res.json(reply(
      session.language === "ML" ? "ഭാഷ തിരഞ്ഞെടുക്കൂ 👇" : "Select Language 👇",
      menu.languageMenu
    ));
  }

  if (text === "LANG_EN") {
    session.language = "EN"; await session.save();
    return res.json(reply("✅ Language switched to English", menuEN.menu));
  }

  if (text === "LANG_ML") {
    session.language = "ML"; await session.save();
    return res.json(reply("✅ ഭാഷ മലയാളമാക്കി ✅", menuML.menu));
  }

  // ✅ MENU reset
  if (text === "MENU") {
    session.state = STATES.MENU; await session.save();
    return res.json(reply(menu.welcome, menu.menu));
  }

  /*************** LATEST RESULTS ***************/
  if (text === "LATEST_RESULTS") {
    return res.json(reply(
      `🧾 *${session.language === "ML" ? "പുതിയ ഫലം" : "Latest Lottery Result"}*\n
🎟 ${latestResult.draw}
📅 ${latestResult.date}
🏆 *${latestResult.winning_number}*
💰 ${latestResult.prize}`,
      menu.viewFullResults
    ));
  }

  if (text === "FULL_RESULTS") {
    const list = fullResults.prizes
      .map(p => `🏅 *${p.position}*\n💰 ${p.amount}\n🎫 ${p.number}`)
      .join("\n\n");

    return res.json(reply(
      `📄 *${session.language === "ML" ? "പൂർണ്ണ ഫലം" : "Full Lottery Result"}*\n\n${list}`,
      menu.back
    ));
  }

  /*************** CLAIM ***************/
  if (text === "CLAIM_INFO") {
    const steps = prizeClaim.steps.map(s => `- ${s}`).join("\n");
    return res.json(reply(
      `🏦 *${session.language === "ML" ? "സമ്മാനം വാങ്ങൽ" : "Prize Claim Steps"}*\n${steps}`,
      menu.back
    ));
  }

  /*************** AGENTS ***************/
  if (text === "AGENTS") {
    session.state = STATES.AGENTS; await session.save();
    return res.json(reply(
      session.language === "ML" ? "ജില്ലയുടെ പേര് ടൈപ്പ് ചെയ്യൂ 👇" : "Enter district name 👇",
      menu.back
    ));
  }

  if (session.state === STATES.AGENTS) {
    const list = getAgentsByDistrict(rawText);
    session.state = STATES.MENU; await session.save();

    if (!list.length)
      return res.json(reply(
        session.language === "ML" ? "❌ ഏജന്റുമാർ ഇല്ല" : "❌ No agents found",
        menu.tryBack
      ));

    const txt = list.map(a =>
      `📍 *${a.district}*\n👤 ${a.name}\n📞 ${a.phone}`
    ).join("\n\n");

    return res.json(reply(txt, menu.back));
  }

  /*************** VERIFY TICKET ***************/
  if (text === "VERIFY") {
    session.state = STATES.VERIFY; await session.save();
    return res.json(reply(
      session.language === "ML" ? "ടിക്കറ്റ് നമ്പർ ടൈപ്പ് ചെയ്യൂ 👇" : "Enter ticket number 👇",
      menu.back
    ));
  }

  if (session.state === STATES.VERIFY) {
    const r = checkTicket(text);
    session.state = STATES.MENU; await session.save();

    if (r.status === "winner")
      return res.json(reply(
        session.language === "ML" ? "🎉 ജേതാവ്!" : "🎉 Winner!",
        menu.claim
      ));

    if (r.status === "valid_not_winner")
      return res.json(reply(
        session.language === "ML" ? "✅ ടിക്കറ്റ് ശരിയാണ് പക്ഷെ സമ്മാനം ഇല്ല" : "✅ Valid ticket but no prize",
        menu.tryBack
      ));

    return res.json(reply(
      session.language === "ML" ? "🚨 സംശയാസ്പദ ടിക്കറ്റ്!" : "🚨 Fake Ticket!",
      menu.fake
    ));
  }

  /*************** REPORT ***************/
  if (text === "REPORT_FAKE") {
    session.state = STATES.REPORT_NAME; await session.save();
    return res.json(reply("📝 Name:", menu.backOnly));
  }

  if (session.state === STATES.REPORT_NAME) {
    session.tempName = rawText;
    session.state = STATES.REPORT_EMAIL; await session.save();
    return res.json(reply("📧 Email:", menu.backOnly));
  }

  if (session.state === STATES.REPORT_EMAIL) {
    if (!validateEmail(rawText))
      return res.json(reply("❌ Invalid Email", menu.backOnly));

    session.tempEmail = rawText;
    session.state = STATES.REPORT_SUBJECT; await session.save();
    return res.json(reply("✍️ Subject:", menu.backOnly));
  }

  if (session.state === STATES.REPORT_SUBJECT) {
    session.tempSubject = rawText;
    session.state = STATES.REPORT_MESSAGE; await session.save();
    return res.json(reply("📨 Issue details:", menu.backOnly));
  }

  if (session.state === STATES.REPORT_MESSAGE) {
    const id = generateRef();

    await saveComplaint({
      name: session.tempName,
      email: session.tempEmail,
      subject: session.tempSubject,
      issue: rawText,
      refId: id
    });

    session.state = STATES.MENU;
    await session.save();
    return res.json(reply(`✅ Submitted\nID: ${id}`, menu.backOnly));
  }

  /*************** CONTACT ***************/
  if (text === "CONTACT_SUPPORT") {
    const txt = contactInfo.contacts
      .map(c => `🏢 *${c.title}*\n${c.address}\n📞 ${c.phone?.join(", ")}`)
      .join("\n\n");

    return res.json(reply(txt, menu.back));
  }

  /*************** FAQ ***************/
  if (text === "FAQ") {
    session.state = STATES.FAQ; await session.save();

    const faqButtons = faqData.faqs.map((f, i) => ({
      label: `❓ ${f.q}`, value: `FAQ_${i}`
    }));

    faqButtons.push({ label: "📝 Type Question", value: "FAQ_TYPING" });
    faqButtons.push({ label: "🔙 Menu", value: "MENU" });

    return res.json(reply("📌 Frequently Asked Questions", faqButtons));
  }

  // ✅ User typed question
  if (text === "FAQ_TYPING") {
    session.state = STATES.FAQ_TYPING; await session.save();
    return res.json(reply("✍️ Ask your question...", menu.faqBack));
  }

  // ✅ handle typed question mode
  if (session.state === STATES.FAQ_TYPING) {
    const ans = findFaqMatch(rawText);
    if (ans) return res.json(reply(`💡 ${ans}`, menu.faqBack));

    const ai = await askAi(rawText, session.language);
    return res.json(reply(ai, menu.faqBack));
  }

  // ✅ handle FAQ single button answers
  if (session.state === STATES.FAQ && text.startsWith("FAQ_")) {
    const i = Number(text.split("_")[1]);
    const f = faqData.faqs[i];

    if (!f) return res.json(reply("❌ Error: FAQ not found", menu.faqBack));

    session.state = STATES.FAQ_ANSWER; await session.save();
    return res.json(reply(`💡 ${f.a}`, menu.faqBack));
  }

  /*************** AI FALLBACK ***************/
  if (session.state === STATES.MENU) {
    const ans = findFaqMatch(rawText);
    if (ans) return res.json(reply(`💡 ${ans}`, menu.back));

    const ai = await askAi(rawText, session.language);
    return res.json(reply(ai, menu.back));
  }

  // DEFAULT safe reset
  return res.json(reply(menu.welcome, menu.menu));
};
