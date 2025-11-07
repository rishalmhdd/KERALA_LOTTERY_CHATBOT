
export function reply(text, buttons = []) {
  return {
    reply: text,
    buttons: (buttons || []).map(btn => ({
      label: btn.label || "",
      // normalize: support btn.value or btn.id
      value: (btn.value ?? btn.id ?? "").toString()
    }))
  };
}
