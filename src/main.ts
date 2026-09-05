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
  const loader = card.querySelector<HTMLElement>("[data-ai-loader]");
  const label = card.querySelector<HTMLElement>("[data-ai-prompt-label]");
  const LOADER_MS = 700;

  const openForm = (promptText: string): void => {
    // Dismiss any lingering tooltip from the clicked prompt button.
    document.querySelector(".tooltip-layer")?.remove();
    if (label) label.textContent = promptText;
    // Keep the empty state in place under the overlay so height doesn't jump.
    if (loader) loader.hidden = false;
    window.setTimeout(() => {
      if (loader) loader.hidden = true;
      if (empty) empty.hidden = true;
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
    if (loader) loader.hidden = true;
    if (empty) empty.hidden = false;
    card.dataset.state = "empty";
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
