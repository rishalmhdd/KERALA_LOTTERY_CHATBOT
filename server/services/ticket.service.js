import fs from "fs";

const latestResult = JSON.parse(fs.readFileSync("./data/latestResult.json", "utf8"));
const validTickets = JSON.parse(fs.readFileSync("./data/validTickets.json", "utf8"));

export function checkTicket(ticket) {
  ticket = ticket.toUpperCase().trim();

  const winner = latestResult.winning_number.replace(/\s+/g, "").toUpperCase();

  if (ticket === winner) return { status: "winner", prize: latestResult.prize };

  if (validTickets.valid.includes(ticket)) return { status: "valid_not_winner" };

  return { status: "fake" };
}
