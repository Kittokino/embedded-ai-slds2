// SLDS 2 stylesheet: the real SLDS 2 bundle (component structure + Cosmos theme
// tokens + global styling hooks --slds-g-*) from @salesforce-ux/design-system-2.
// Icon sprites and the avatar are served statically from public/assets/.
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

  const SHOW_DELAY = 250; // ms before a tooltip appears
  let timer: number | undefined;

  document.querySelectorAll<HTMLElement>("[data-tooltip]").forEach((trigger) => {
    const open = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => show(trigger), SHOW_DELAY);
    };
    const close = () => {
      window.clearTimeout(timer);
      trigger.removeAttribute("aria-describedby");
      hide();
    };
    trigger.addEventListener("mouseenter", open);
    trigger.addEventListener("mouseleave", close);
    trigger.addEventListener("focus", open);
    trigger.addEventListener("blur", close);
    // Clicking the trigger dismisses the tooltip (and cancels a pending one).
    trigger.addEventListener("click", close);
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
  const purposeBox = card.querySelector<HTMLElement>('[data-field="purpose"]');
  const emailEl = card.querySelector<HTMLElement>("[data-ai-email]");
  const genTime = card.querySelector<HTMLElement>("[data-ai-gentime]");
  const additionalInput = card.querySelector<HTMLTextAreaElement>(".ai-form__textarea");
  const promptLabels = card.querySelectorAll<HTMLElement>("[data-prompt-label]");
  const LOADER_MS = 700;

  const esc = (s: string): string =>
    s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
  // Keep the prompt label in sync across the form and result states, and
  // reshape the form's fields to suit the active prompt.
  const setPrompt = (text: string): void => {
    promptLabels.forEach((el) => (el.textContent = text));
    applyPromptConfig(text);
  };

  // Relabel a lookup field and toggle its required marker.
  function relabel(box: HTMLElement | null, text: string, required: boolean): void {
    const field = box?.closest(".ai-field");
    const span = field?.querySelector<HTMLElement>("[data-label-text]");
    const abbr = field?.querySelector<HTMLElement>(".slds-required");
    if (span) span.textContent = text;
    if (abbr) abbr.hidden = !required;
  }

  // Only two prompts have real forms; the rest show a placeholder panel.
  const placeholderEl = card.querySelector<HTMLElement>("[data-ai-placeholder]");

  // Reshape the form for the active prompt: Pre-Call Briefing swaps in its own
  // field set; Personalized Upsell Email uses the default fields; every other
  // prompt is unwired and shows the placeholder instead of a form.
  function applyPromptConfig(text: string): void {
    const briefing = text === "Pre-Call Briefing";
    const wired = text === "Personalized Upsell Email" || briefing;
    card!.classList.toggle("is-briefing", briefing);
    card!.classList.toggle("is-placeholder", !wired);
    if (placeholderEl) placeholderEl.hidden = wired;
    form?.querySelectorAll<HTMLElement>("[data-briefing-only]").forEach((el) => (el.hidden = !briefing));
    form?.querySelectorAll<HTMLElement>("[data-default-only]").forEach((el) => (el.hidden = briefing));
    relabel(oppBox, briefing ? "Related Opportunity" : "Opportunity", !briefing);
    relabel(contactBox, briefing ? "Meeting with" : "Contact", true);
    updateGenerate();
  }

  // Placeholder "Try …" links jump straight into a wired prompt's form.
  card.querySelectorAll<HTMLElement>("[data-jump-prompt]").forEach((link) => {
    link.addEventListener("click", () => openForm(link.dataset.jumpPrompt!));
  });

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
    if (btn.dataset.prompt === "more") return; // "More" toggles extra prompts, below
    btn.addEventListener("click", () => {
      const text = btn.querySelector("span")?.textContent?.trim() ?? "Personalized Upsell Email";
      openForm(text);
    });
  });

  // "More" opens a dropdown menu of additional predefined prompts.
  const moreBtn = card.querySelector<HTMLElement>('[data-prompt="more"]');
  const moreMenu = card.querySelector<HTMLElement>("[data-more-menu]");
  const closeMore = (): void => {
    if (!moreMenu) return;
    moreMenu.hidden = true;
    moreBtn?.classList.remove("is-open");
    moreBtn?.setAttribute("aria-expanded", "false");
  };
  moreBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!moreMenu) return;
    const show = moreMenu.hidden === true;
    moreMenu.hidden = !show;
    moreBtn.classList.toggle("is-open", show);
    moreBtn.setAttribute("aria-expanded", String(show));
  });
  moreMenu?.addEventListener("click", (e) => e.stopPropagation());
  moreMenu?.querySelectorAll<HTMLElement>("[data-prompt]").forEach((opt) => {
    opt.addEventListener("click", closeMore);
  });
  document.addEventListener("click", closeMore);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMore();
  });

  card.querySelector<HTMLElement>("[data-ai-back]")?.addEventListener("click", () => {
    if (form) form.hidden = true;
    if (result) result.hidden = true;
    if (loader) loader.hidden = true;
    if (empty) empty.hidden = false;
    card.dataset.state = "empty";
  });

  // Enable Generate once the active prompt's required fields are chosen:
  // Contact + Call purpose for a briefing, Opportunity + Contact otherwise.
  const requiredMet = (): boolean =>
    card.classList.contains("is-briefing")
      ? Boolean(contactBox?.dataset.value && purposeBox?.dataset.value)
      : Boolean(oppBox?.dataset.value && contactBox?.dataset.value);
  const updateGenerate = (): void => {
    if (generateBtn) generateBtn.disabled = !requiredMet();
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

  // Build the mock Pre-Call Briefing: bold section headers with bulleted
  // points and numbered citations back to the Sources list, woven together
  // from the form inputs (contact, opportunity, call purpose).
  const buildBriefing = (): void => {
    if (!emailEl) return;
    const contact = esc(contactBox?.dataset.value ?? "your contact");
    const first = contact.split(" ")[0];
    const purpose = esc(purposeBox?.dataset.value ?? "upcoming");
    const account = "Acme, Inc.";
    const opp = oppBox?.dataset.value ? esc(oppBox.dataset.value) : null;
    const oppText = opp ?? "the open opportunity";
    // Citations link back to the numbered Sources below the briefing.
    const cite = (n: number): string => `<a href="#" class="ai-cite" data-cite="${n}">[${n}]</a>`;

    emailEl.innerHTML = `
      <p class="ai-brief__lead">Briefing for your <strong>${purpose}</strong> call with <strong>${contact}</strong> at <strong>${account}</strong>${opp ? `, focused on <strong>${opp}</strong>` : ""}.</p>

      <h4 class="ai-brief__head">Key Points from Recent Call Log:</h4>
      <ul class="ai-brief__list">
        <li>Discussed progress on the rollout of the “SynergyConnect” platform and the next integration milestones. ${cite(1)}</li>
        <li>${first} asked about advanced reporting features and how they tie into their existing “DataView” system.</li>
        <li>Noted a minor delay in receiving the final documentation for API access. ${cite(2)}</li>
      </ul>

      <h4 class="ai-brief__head">${oppText} — Current Status:</h4>
      <ul class="ai-brief__list">
        <li>Stage is <strong>Negotiation</strong>; ${account} is evaluating the proposed expansion terms.</li>
        <li>Primary interest is scaling licenses and the add-on modules discussed last quarter. ${cite(3)}</li>
      </ul>

      <h4 class="ai-brief__head">Resolution Status of Last Support Ticket (TS005):</h4>
      <ul class="ai-brief__list">
        <li>The intermittent connectivity issue on the legacy system was marked <strong>Resolved</strong>.</li>
        <li>The fix involved a software patch and a configuration update to the integration layer.</li>
      </ul>

      <h4 class="ai-brief__head">Recommended Talking Points for this ${purpose} Call:</h4>
      <ul class="ai-brief__list">
        <li>Confirm the API documentation has landed and unblock the integration timeline.</li>
        <li>Reaffirm the value of the reporting add-ons ahead of ${oppText}.</li>
        <li>Align with ${first} on next steps and a target close date.</li>
      </ul>`;
  };

  // Pick the right generator for the active prompt.
  const buildResult = (): void => {
    if (card.classList.contains("is-briefing")) buildBriefing();
    else buildEmail();
  };
  // Citations are illustrative in the prototype — don't jump the page.
  emailEl?.addEventListener("click", (e) => {
    const cite = (e.target as HTMLElement)?.closest(".ai-cite");
    if (cite) e.preventDefault();
  });

  const showResult = (): void => {
    buildResult();
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
    if (requiredMet()) showResult();
  });

  // Regenerate: brief spinner, then refresh the email + timestamp in place.
  card.querySelector<HTMLElement>("[data-ai-regen]")?.addEventListener("click", () => {
    if (loader) loader.hidden = false;
    window.setTimeout(() => {
      if (loader) loader.hidden = true;
      buildResult();
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
    const S = "assets/icons/utility-sprite/svg/symbols.svg";
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
        const text = opt.textContent!.trim();
        closePromptMenus();
        // From a generated result, switching prompt loads that prompt's form;
        // while already in the form, just reshape it to the chosen prompt.
        if (card.dataset.state === "result") openForm(text);
        else setPrompt(text);
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

/**
 * Presenter feature cue: Ctrl+H or Shift+H toggles a gentle pulsing ring on
 * the AI Summary widget; Esc clears it. Ignored while typing in a field.
 */
function initPresenterCue(): void {
  const card = document.querySelector<HTMLElement>("#ai-summary");
  if (!card) return;

  const isTyping = (t: EventTarget | null): boolean => {
    const el = t as HTMLElement | null;
    return (
      !!el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable)
    );
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      card.classList.remove("ai-cue");
      return;
    }
    if ((e.key === "h" || e.key === "H") && (e.ctrlKey || e.shiftKey) && !e.metaKey && !e.altKey) {
      if (isTyping(e.target)) return;
      e.preventDefault(); // suppress Ctrl+H (browser history)
      card.classList.toggle("ai-cue");
    }
  });
}

initPresenterCue();

/** Collapsible "Sources" section in the AI Summary result. */
function initSources(): void {
  document.querySelectorAll<HTMLElement>("[data-sources-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.closest<HTMLElement>(".ai-result__sources");
      const list = section?.querySelector<HTMLElement>("[data-sources-list]");
      if (!section || !list) return;
      const collapsed = section.classList.toggle("is-collapsed");
      list.hidden = collapsed;
      btn.setAttribute("aria-expanded", String(!collapsed));
    });
  });
}

initSources();

/** Collapsible cards: double-click the header to expand/collapse the card. */
function initCollapsibleCards(): void {
  document.querySelectorAll<HTMLElement>("[data-collapsible]").forEach((card) => {
    const header = card.querySelector<HTMLElement>(".slds-card__header");
    header?.addEventListener("dblclick", () => {
      card.classList.toggle("is-collapsed");
    });
  });
}

initCollapsibleCards();

/**
 * "Prompt Templates" modal — an SLDS dueling list. The Available panel groups
 * templates by category (bold headers); the move buttons transfer the
 * highlighted template between Available and Selected; the reorder buttons
 * order the Selected list; selecting a template shows its details. Save commits
 * the Selected order.
 */
function initPinPrompts(): void {
  const modal = document.querySelector<HTMLElement>("[data-pin-modal]");
  if (!modal) return;

  const availList = modal.querySelector<HTMLElement>("[data-avail-list]")!;
  const selList = modal.querySelector<HTMLElement>("[data-selected-list]")!;
  const details = modal.querySelector<HTMLElement>("[data-pin-details]")!;
  const moveRight = modal.querySelector<HTMLButtonElement>("[data-move-right]")!;
  const moveLeft = modal.querySelector<HTMLButtonElement>("[data-move-left]")!;
  const reorderUp = modal.querySelector<HTMLButtonElement>("[data-reorder-up]")!;
  const reorderDown = modal.querySelector<HTMLButtonElement>("[data-reorder-down]")!;

  interface Tpl { id: string; label: string; desc: string; body?: string; }
  interface Group { cat: string; items: Tpl[]; }
  const CATALOG: Group[] = [
    { cat: "Email", items: [
      { id: "upsell", label: "Personalized Upsell Email", desc: "Draft a personalized email suggesting relevant add-ons and upgrades for this account." },
      { id: "followup", label: "Meeting Follow-up Email", desc: "Recap the meeting with clear action items and the agreed next steps.", body: `<p class="pin-details__desc">Drafts a concise, professional recap email after a customer meeting. It pulls the meeting notes, the attendees, and any commitments made, then produces an email that thanks the attendees, summarizes what was discussed, restates decisions, and lists action items with owners and due dates.</p><h4 class="pin-details__subhead">Prompt instructions</h4><p class="pin-details__quote">You are a helpful sales assistant. Using the meeting notes for {Account}, write a follow-up email to {Contact}. Open with a brief thank-you, summarize the key discussion points in two to three sentences, restate any decisions that were made, then list the agreed action items as bullets with an owner and a target date for each. Keep the tone warm and professional and under 200 words, and close with a clear next step and a sign-off.</p><h4 class="pin-details__subhead">Grounding data</h4><ul class="pin-details__list"><li>Account and contact details</li><li>Meeting notes and call transcript</li><li>Open action items and tasks</li><li>Recent activity on the account</li></ul><h4 class="pin-details__subhead">Output</h4><p class="pin-details__desc">A plain-text email with a subject line, greeting, a short recap, an action-item list, and a sign-off. Review before sending.</p>` },
      { id: "renewal-email", label: "Renewal Reminder Email", desc: "Remind the customer of an upcoming renewal with the key terms and the value delivered so far." },
    ]},
    { cat: "Prep", items: [
      { id: "briefing", label: "Pre-Call Briefing", desc: "Summarize the account's status, key contacts, and recent activity ahead of a call." },
      { id: "objection", label: "Objection Handling", desc: "Anticipate likely objections and suggest responses tailored to this account." },
      { id: "discovery", label: "Discovery Questions", desc: "Generate discovery questions to uncover needs and qualify the opportunity." },
    ]},
    { cat: "Insight", items: [
      { id: "account-summary", label: "Account Summary", desc: "Summarize this account — key details, recent activity, and relationships at a glance." },
      { id: "opp-summary", label: "Opportunity Summary", desc: "Summarize the open opportunity — stage, amount, close date, and momentum." },
      { id: "stakeholder", label: "Stakeholder Map", desc: "Map the key contacts, their roles, and their influence across the account." },
      { id: "battlecard", label: "Competitive Battlecard", desc: "Position against a competitor mentioned in this account." },
    ]},
    { cat: "Action", items: [
      { id: "next-steps", label: "Recommended Next Steps", desc: "Suggest the best next actions based on the account's stage and recent activity." },
    ]},
    { cat: "Risk", items: [
      { id: "renewal-risk", label: "Renewal Risk Assessment", desc: "Assess renewal and churn risk from activity gaps, sentiment, and competitive signals." },
      { id: "deal-risk", label: "Deal Risk Analysis", desc: "Analyze what could stall the open opportunity and how to de-risk it." },
    ]},
  ];
  const byId = (id: string): Tpl | undefined =>
    CATALOG.flatMap((g) => g.items).find((t) => t.id === id);

  let committed = ["upsell", "briefing", "account-summary", "next-steps", "renewal-risk"];
  let selected: string[] = [...committed];
  let highlighted: string | null = null;

  const SPROUT = `<svg class="pin-details__art" viewBox="0 0 160 100" width="150" height="94" aria-hidden="true"><circle cx="96" cy="36" r="22" fill="#dce8ff"/><path d="M70 16l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#0b5cab"/><path d="M118 26l1.8 4.5 4.5 1.8-4.5 1.8-1.8 4.5-1.8-4.5-4.5-1.8 4.5-1.8z" fill="#7cb1fe"/><g stroke="#7fa8f0" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M60 90V70"/><path d="M80 90V62"/><path d="M100 90V72"/></g><g fill="#a9c7fb"><ellipse cx="53" cy="70" rx="7" ry="4" transform="rotate(-28 53 70)"/><ellipse cx="67" cy="70" rx="7" ry="4" transform="rotate(28 67 70)"/><ellipse cx="72" cy="62" rx="8" ry="4.5" transform="rotate(-28 72 62)"/><ellipse cx="88" cy="62" rx="8" ry="4.5" transform="rotate(28 88 62)"/><ellipse cx="93" cy="72" rx="7" ry="4" transform="rotate(-28 93 72)"/><ellipse cx="107" cy="72" rx="7" ry="4" transform="rotate(28 107 72)"/></g></svg>`;

  const render = (): void => {
    availList.innerHTML = CATALOG.map((g) => {
      const items = g.items.filter((t) => !selected.includes(t.id));
      if (!items.length) return "";
      return (
        `<li class="pin-group" role="presentation">${g.cat}</li>` +
        items
          .map((t) => `<li class="pin-opt${highlighted === t.id ? " is-highlighted" : ""}" role="option" aria-selected="${highlighted === t.id}" data-id="${t.id}">${t.label}</li>`)
          .join("")
      );
    }).join("");

    selList.innerHTML = selected
      .map((id) => {
        const t = byId(id);
        if (!t) return "";
        return `<li class="pin-opt${highlighted === id ? " is-highlighted" : ""}" role="option" aria-selected="${highlighted === id}" data-id="${id}">${t.label}</li>`;
      })
      .join("");

    const inSel = highlighted !== null && selected.includes(highlighted);
    const inAvail = highlighted !== null && !inSel;
    const idx = highlighted !== null ? selected.indexOf(highlighted) : -1;
    moveRight.disabled = !inAvail;
    moveLeft.disabled = !inSel;
    reorderUp.disabled = !inSel || idx <= 0;
    reorderDown.disabled = !inSel || idx >= selected.length - 1;

    const t = highlighted ? byId(highlighted) : undefined;
    details.innerHTML = t
      ? `<div class="pin-details__name">${t.label}</div>${t.body ?? `<div class="pin-details__desc">${t.desc}</div>`}`
      : `<div class="pin-details__empty">${SPROUT}<span>No Prompt Template Selected</span></div>`;
  };

  [availList, selList].forEach((list) =>
    list.addEventListener("click", (e) => {
      const opt = (e.target as HTMLElement).closest<HTMLElement>(".pin-opt");
      if (!opt) return;
      highlighted = opt.dataset.id ?? null;
      render();
    })
  );
  moveRight.addEventListener("click", () => {
    if (highlighted && !selected.includes(highlighted)) {
      selected.push(highlighted);
      render();
    }
  });
  moveLeft.addEventListener("click", () => {
    if (highlighted && selected.includes(highlighted)) {
      selected = selected.filter((x) => x !== highlighted);
      render();
    }
  });
  const reorder = (dir: number): void => {
    if (highlighted === null) return;
    const i = selected.indexOf(highlighted);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= selected.length) return;
    [selected[i], selected[j]] = [selected[j], selected[i]];
    render();
  };
  reorderUp.addEventListener("click", () => reorder(-1));
  reorderDown.addEventListener("click", () => reorder(1));

  const open = (): void => {
    selected = [...committed];
    highlighted = null;
    render();
    modal.hidden = false;
  };
  const close = (): void => {
    modal.hidden = true;
  };
  modal.querySelectorAll<HTMLElement>("[data-pin-close]").forEach((b) => b.addEventListener("click", close));
  modal.querySelector<HTMLElement>("[data-pin-save]")?.addEventListener("click", () => {
    committed = [...selected];
    close();
  });
  // "Add a Custom Prompt" — placeholder for a future workflow (not built here).
  modal.querySelector<HTMLElement>("[data-add-custom]")?.addEventListener("click", () => {});
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  // Open from the "Edit pinned prompts" item in the More menu.
  document.querySelector<HTMLElement>("[data-edit-pinned]")?.addEventListener("click", () => {
    const menu = document.querySelector<HTMLElement>("[data-more-menu]");
    if (menu) menu.hidden = true;
    const moreBtn = document.querySelector<HTMLElement>('[data-prompt="more"]');
    moreBtn?.classList.remove("is-open");
    moreBtn?.setAttribute("aria-expanded", "false");
    open();
  });
}

initPinPrompts();

/**
 * Expand: move the whole AI Summary widget into a modal (keeping all its wired
 * interactions, since it's the same DOM node); the Expand button, backdrop, or
 * Escape returns it to its place on the page.
 */
function initExpand(): void {
  const card = document.querySelector<HTMLElement>("#ai-summary");
  const modal = document.querySelector<HTMLElement>("[data-expand-modal]");
  const slot = modal?.querySelector<HTMLElement>("[data-expand-slot]");
  const toggle = card?.querySelector<HTMLElement>("[data-expand-toggle]");
  if (!card || !modal || !slot || !toggle) return;

  const toggleIcon = toggle.querySelector("use");
  const S = "assets/icons/utility-sprite/svg/symbols.svg";
  let placeholder: Comment | null = null;
  const expand = (): void => {
    placeholder = document.createComment("ai-summary-slot");
    card.parentNode?.insertBefore(placeholder, card);
    slot.appendChild(card);
    card.classList.add("is-expanded");
    toggleIcon?.setAttribute("href", `${S}#contract_alt`);
    toggle.setAttribute("title", "Collapse");
    modal.hidden = false;
  };
  const collapse = (): void => {
    if (placeholder?.parentNode) placeholder.parentNode.insertBefore(card, placeholder);
    placeholder?.remove();
    placeholder = null;
    card.classList.remove("is-expanded");
    toggleIcon?.setAttribute("href", `${S}#expand_alt`);
    toggle.setAttribute("title", "Expand");
    modal.hidden = true;
  };

  toggle.addEventListener("click", () => (modal.hidden ? expand() : collapse()));
  modal.querySelectorAll<HTMLElement>("[data-expand-close]").forEach((b) => b.addEventListener("click", collapse));
  document.addEventListener("keydown", (e) => {
    // Let an open Prompt Templates modal take Escape first.
    if (e.key === "Escape" && !modal.hidden && document.querySelector<HTMLElement>("[data-pin-modal]")?.hidden !== false) {
      collapse();
    }
  });
}

initExpand();
