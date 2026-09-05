// SLDS 2 stylesheet: the real SLDS 2 bundle (component structure + Cosmos theme
// tokens + global styling hooks --slds-g-*) from @salesforce-ux/design-system-2.
// Icon sprites/images are still served from the SLDS 1 package via vite.config.ts.
import "@salesforce-ux/design-system-2/dist/css/bundled/slds2.cosmos.css";
import "./styles/app.css";

/**
 * SLDS tooltips for any element carrying a `data-tooltip` attribute.
 * Renders the SLDS popover-tooltip pattern above the trigger (bottom nubbin),
 * on hover and on keyboard focus, and links it via aria-describedby.
 */
function initTooltips(): void {
  const GAP = 8; // space between trigger and nubbin
  let tip: HTMLElement | null = null;
  let currentId = 0;

  const hide = (): void => {
    if (!tip) return;
    tip.remove();
    tip = null;
  };

  const show = (trigger: HTMLElement): void => {
    const text = trigger.dataset.tooltip;
    if (!text) return;
    hide();

    const id = `slds-tooltip-${++currentId}`;
    tip = document.createElement("div");
    tip.id = id;
    tip.setAttribute("role", "tooltip");
    tip.className =
      "slds-popover slds-popover_tooltip slds-nubbin_bottom tooltip-layer";
    tip.innerHTML = `<div class="slds-popover__body">${text}</div>`;
    document.body.appendChild(tip);
    trigger.setAttribute("aria-describedby", id);

    // Position centered above the trigger, clamped to the viewport.
    const t = trigger.getBoundingClientRect();
    const p = tip.getBoundingClientRect();
    let left = t.left + window.scrollX + t.width / 2 - p.width / 2;
    left = Math.max(
      GAP,
      Math.min(left, window.scrollX + document.documentElement.clientWidth - p.width - GAP)
    );
    const top = t.top + window.scrollY - p.height - GAP;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };

  document.querySelectorAll<HTMLElement>("[data-tooltip]").forEach((trigger) => {
    const open = () => show(trigger);
    const close = () => {
      trigger.removeAttribute("aria-describedby");
      hide();
    };
    trigger.addEventListener("mouseenter", open);
    trigger.addEventListener("mouseleave", close);
    trigger.addEventListener("focus", open);
    trigger.addEventListener("blur", close);
  });

  // Dismiss on Escape for keyboard users.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
}

initTooltips();

/**
 * AI Summary widget: clicking a prompt shows a brief Salesforce spinner, then
 * swaps the empty "Start with a prompt" state for the prompt form. "Back"
 * restores the original empty state.
 */
function initAiSummary(): void {
  const card = document.querySelector<HTMLElement>("#ai-summary");
  if (!card) return;

  const empty = card.querySelector<HTMLElement>("[data-ai-empty]");
  const form = card.querySelector<HTMLElement>("[data-ai-form]");
  const result = card.querySelector<HTMLElement>("[data-ai-result]");
  const loader = card.querySelector<HTMLElement>("[data-ai-loader]");
  const generateBtn = card.querySelector<HTMLButtonElement>(".ai-form__generate");
  const oppBox = card.querySelector<HTMLElement>('[data-field="opportunity"]');
  const contactBox = card.querySelector<HTMLElement>('[data-field="contact"]');
  const emailEl = card.querySelector<HTMLElement>("[data-ai-email]");
  const genTime = card.querySelector<HTMLElement>("[data-ai-gentime]");
  const additionalInput = card.querySelector<HTMLTextAreaElement>(".ai-form__textarea");
  const promptLabels = card.querySelectorAll<HTMLElement>("[data-prompt-label]");
  const LOADER_MS = 700;

  const esc = (s: string): string =>
    s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
  // Keep the prompt label in sync across the form and result states.
  const setPrompt = (text: string): void => {
    promptLabels.forEach((el) => (el.textContent = text));
  };

  const openForm = (promptText: string): void => {
    // Dismiss any lingering tooltip from the clicked prompt button.
    document.querySelector(".tooltip-layer")?.remove();
    setPrompt(promptText);
    // Keep the empty state in place under the overlay so height doesn't jump.
    if (loader) loader.hidden = false;
    window.setTimeout(() => {
      if (loader) loader.hidden = true;
      if (empty) empty.hidden = true;
      if (result) result.hidden = true;
      if (form) form.hidden = false;
      card.dataset.state = "form";
    }, LOADER_MS);
  };

  card.querySelectorAll<HTMLElement>("[data-prompt]").forEach((btn) => {
    if (btn.dataset.prompt === "more") return; // no form for "More" yet
    btn.addEventListener("click", () => {
      const text = btn.querySelector("span")?.textContent?.trim() ?? "Personalized Upsell Email";
      openForm(text);
    });
  });

  card.querySelector<HTMLElement>("[data-ai-back]")?.addEventListener("click", () => {
    if (form) form.hidden = true;
    if (result) result.hidden = true;
    if (loader) loader.hidden = true;
    if (empty) empty.hidden = false;
    card.dataset.state = "empty";
  });

  // Enable Generate only once both Opportunity and Contact are chosen.
  const bothSelected = (): boolean => Boolean(oppBox?.dataset.value && contactBox?.dataset.value);
  const updateGenerate = (): void => {
    if (generateBtn) generateBtn.disabled = !bothSelected();
  };
  card.addEventListener("combobox:change", updateGenerate);
  updateGenerate();

  const nowTime = (): string =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // Build the mock "generated" email using the selected contact's first name.
  const buildEmail = (): void => {
    if (!emailEl) return;
    const first = esc((contactBox?.dataset.value ?? "there").split(" ")[0]);
    const account = "Acme";
    const opp = esc(oppBox?.dataset.value ?? "this opportunity");
    const extra = (additionalInput?.value ?? "").trim();
    const paras = [
      `Dear ${first},`,
      `I hope this message finds you well. Thank you for your continued interest in partnering with us — your support as a champion for ${account} has meant a great deal, and we’re excited about what we can build together.`,
      // The opportunity is bolded to show the AI used the selected input.
      `Given your interest in <strong>${opp}</strong>, I’d love to explore how it can deliver real impact for your team. Based on results we’ve seen with similar organizations, this is a strong opportunity to build on the value you’re already getting.`,
      `Would you be open to a short call this week to walk through the details and answer any questions? I’m confident we can shape a plan that fits ${account}’s goals.`,
    ];
    // Fold in Additional Input when present, but unbolded: the real model
    // paraphrases free text, so bolding would misrepresent it as verbatim.
    if (extra) {
      paras.push(`You also mentioned: ${esc(extra)} — I’ll be sure to weave that into our conversation.`);
    }
    paras.push(`Looking forward to hearing from you.`);
    paras.push(`Warm regards,<br>Your Account Team`);
    emailEl.innerHTML = paras.map((p) => `<p>${p}</p>`).join("");
  };

  const showResult = (): void => {
    buildEmail();
    if (genTime) genTime.textContent = nowTime();
    if (loader) loader.hidden = false;
    window.setTimeout(() => {
      if (loader) loader.hidden = true;
      if (form) form.hidden = true;
      if (empty) empty.hidden = true;
      if (result) result.hidden = false;
      card.dataset.state = "result";
    }, LOADER_MS);
  };

  generateBtn?.addEventListener("click", () => {
    if (bothSelected()) showResult();
  });

  // Regenerate: brief spinner, then refresh the email + timestamp in place.
  card.querySelector<HTMLElement>("[data-ai-regen]")?.addEventListener("click", () => {
    if (loader) loader.hidden = false;
    window.setTimeout(() => {
      if (loader) loader.hidden = true;
      buildEmail();
      if (genTime) genTime.textContent = nowTime();
    }, LOADER_MS);
  });

  // Result "Back" returns to the form (selections preserved for editing).
  card.querySelector<HTMLElement>("[data-ai-back-result]")?.addEventListener("click", () => {
    if (result) result.hidden = true;
    if (loader) loader.hidden = true;
    if (form) form.hidden = false;
    card.dataset.state = "form";
  });

  // Copy the generated email to the clipboard, then show an SLDS toast.
  const showToast = (message: string): void => {
    let cont = document.querySelector<HTMLElement>(".app-toast");
    if (!cont) {
      cont = document.createElement("div");
      cont.className = "app-toast";
      document.body.appendChild(cont);
    }
    const box = cont;
    const S = "/assets/icons/utility-sprite/svg/symbols.svg";
    box.innerHTML =
      `<div class="slds-notify slds-notify_toast slds-theme_success" role="status">` +
      `<span class="slds-assistive-text">Success</span>` +
      `<span class="slds-icon_container slds-icon-utility-success slds-m-right_small"><svg class="slds-icon slds-icon_small" aria-hidden="true"><use href="${S}#success"></use></svg></span>` +
      `<div class="slds-notify__content"><h2 class="slds-text-heading_small">${message}</h2></div>` +
      `<div class="slds-notify__close"><button class="slds-button slds-button_icon slds-button_icon-inverse" title="Close" data-toast-close><svg class="slds-button__icon"><use href="${S}#close"></use></svg></button></div>` +
      `</div>`;
    box.querySelector("[data-toast-close]")?.addEventListener("click", () => (box.innerHTML = ""));
    window.clearTimeout(Number(box.dataset.timer));
    box.dataset.timer = String(window.setTimeout(() => (box.innerHTML = ""), 3000));
  };

  card.querySelector<HTMLElement>("[data-ai-copy]")?.addEventListener("click", () => {
    const text = emailEl?.innerText ?? "";
    const done = (): void => showToast("Text copied to clipboard.");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  });

  // Prompt switcher (the chevron next to "Prompt:") — form and result states.
  const promptSwitches = card.querySelectorAll<HTMLElement>("[data-prompt-switch]");
  const closePromptMenus = (): void => {
    promptSwitches.forEach((sw) => {
      sw.classList.remove("is-open");
      const menu = sw.querySelector<HTMLElement>("[data-prompt-menu]");
      if (menu) menu.hidden = true;
      sw.querySelector("[data-prompt-trigger]")?.setAttribute("aria-expanded", "false");
    });
  };
  promptSwitches.forEach((sw) => {
    const trigger = sw.querySelector<HTMLElement>("[data-prompt-trigger]");
    const menu = sw.querySelector<HTMLElement>("[data-prompt-menu]");
    trigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = sw.classList.contains("is-open");
      closePromptMenus();
      if (!open) {
        sw.classList.add("is-open");
        if (menu) menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      }
    });
    sw.querySelectorAll<HTMLElement>("[data-prompt-option]").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        setPrompt(opt.textContent!.trim());
        closePromptMenus();
      });
    });
  });
  document.addEventListener("click", closePromptMenus);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePromptMenus();
  });
}

initAiSummary();

/**
 * Custom dropdowns for the AI Summary form (Opportunity, Contact). Click to
 * open a styled listbox; searchable ones ([data-searchable]) filter as you
 * type. Closes on outside click or Escape.
 */
function initComboboxes(): void {
  const boxes = Array.from(document.querySelectorAll<HTMLElement>("[data-combobox]"));
  if (!boxes.length) return;

  const setOpen = (box: HTMLElement, open: boolean): void => {
    const list = box.querySelector<HTMLElement>("[data-combobox-list]");
    const trigger = box.querySelector<HTMLElement>("[data-combobox-trigger]");
    if (list) list.hidden = !open;
    trigger?.setAttribute("aria-expanded", String(open));
    box.classList.toggle("is-open", open);
    if (open) {
      const search = box.querySelector<HTMLInputElement>("[data-combobox-search]");
      if (search) {
        search.value = "";
        filter(box, "");
        window.setTimeout(() => search.focus(), 0);
      }
    }
  };

  const closeAll = (except?: HTMLElement): void => {
    boxes.forEach((b) => b !== except && setOpen(b, false));
  };

  const filter = (box: HTMLElement, q: string): void => {
    const query = q.trim().toLowerCase();
    const empty = box.querySelector<HTMLElement>("[data-combobox-empty]");
    let any = false;
    box.querySelectorAll<HTMLElement>(".ai-dropdown__option").forEach((opt) => {
      const match = opt.textContent!.toLowerCase().includes(query);
      opt.hidden = !match;
      if (match) any = true;
    });
    if (empty) empty.hidden = any;
  };

  const select = (box: HTMLElement, text: string): void => {
    const value = box.querySelector<HTMLElement>("[data-combobox-value]");
    if (value) {
      value.textContent = text;
      value.classList.remove("is-placeholder");
    }
    box.dataset.value = text;
    box.dispatchEvent(new CustomEvent("combobox:change", { bubbles: true, detail: { value: text } }));
    setOpen(box, false);
    box.querySelector<HTMLElement>("[data-combobox-trigger]")?.focus();
  };

  boxes.forEach((box) => {
    box.querySelector<HTMLElement>("[data-combobox-trigger]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = box.classList.contains("is-open");
      closeAll(box);
      setOpen(box, !open);
    });
    box.querySelectorAll<HTMLElement>(".ai-dropdown__option").forEach((opt) => {
      opt.addEventListener("click", () => select(box, opt.textContent!.trim()));
    });
    const search = box.querySelector<HTMLInputElement>("[data-combobox-search]");
    search?.addEventListener("input", () => filter(box, search.value));
    box.querySelector<HTMLElement>("[data-combobox-list]")?.addEventListener("click", (e) => e.stopPropagation());
  });

  document.addEventListener("click", () => closeAll());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}

initComboboxes();
