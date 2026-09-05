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
