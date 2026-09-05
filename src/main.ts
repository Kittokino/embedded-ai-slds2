// SLDS 2 stylesheet: the real SLDS 2 bundle (component structure + Cosmos theme
// tokens + global styling hooks --slds-g-*) from @salesforce-ux/design-system-2.
// Icon sprites/images are still served from the SLDS 1 package via vite.config.ts.
import "@salesforce-ux/design-system-2/dist/css/bundled/slds2.cosmos.css";
import "./styles/app.css";

const UTILITY = "/assets/icons/utility-sprite/svg/symbols.svg";
const STANDARD = "/assets/icons/standard-sprite/svg/symbols.svg";

/** SLDS icon via the sprite sheet (id = icon name). */
function icon(sprite: string, name: string, cls: string): string {
  return `
    <svg class="${cls}" aria-hidden="true">
      <use href="${sprite}#${name}"></use>
    </svg>`;
}

/** A swatch proving an SLDS 2 global styling hook resolves to a real value. */
function swatch(hook: string): string {
  return `
    <div class="hook-swatch">
      <span class="hook-swatch__chip" style="background:var(${hook})"></span>
      <code class="hook-swatch__label">${hook}</code>
    </div>`;
}

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="slds-scope">
    <div class="slds-page-header">
      <div class="slds-page-header__row">
        <div class="slds-page-header__col-title">
          <div class="slds-media">
            <div class="slds-media__figure">
              <span class="slds-icon_container slds-icon-standard-bot">
                ${icon(STANDARD, "bot", "slds-icon slds-icon_medium")}
              </span>
            </div>
            <div class="slds-media__body">
              <div class="slds-page-header__name">
                <div class="slds-page-header__name-title">
                  <h1>
                    <span class="slds-page-header__title slds-truncate">Embedded AI with SLDS 2</span>
                  </h1>
                </div>
              </div>
              <p class="slds-page-header__name-meta">Scaffold verified &middot; SLDS 2 ${
                import.meta.env.DEV ? "(dev)" : ""
              }</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slds-p-around_large">
      <article class="slds-card">
        <div class="slds-card__header slds-grid">
          <header class="slds-media slds-media_center slds-has-flexi-truncate">
            <div class="slds-media__figure">
              <span class="slds-icon_container slds-icon-standard-einstein">
                ${icon(STANDARD, "einstein", "slds-icon slds-icon_small")}
              </span>
            </div>
            <div class="slds-media__body">
              <h2 class="slds-card__header-title">
                <span class="slds-text-heading_small">Setup check</span>
              </h2>
            </div>
          </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
          <p class="slds-m-bottom_medium">
            Vite + TypeScript is running and the SLDS 2 stylesheet is loaded. Buttons and icons
            below use the component framework; the swatches use SLDS 2 global styling hooks.
          </p>

          <div class="slds-m-bottom_medium">
            <button class="slds-button slds-button_brand">
              ${icon(UTILITY, "add", "slds-button__icon slds-button__icon_left")}
              Primary action
            </button>
            <button class="slds-button slds-button_neutral">
              ${icon(UTILITY, "search", "slds-button__icon slds-button__icon_left")}
              Search
            </button>
            <button class="slds-button slds-button_outline-brand">Outline</button>
          </div>

          <h3 class="slds-text-title_caps slds-m-bottom_x-small">SLDS 2 global styling hooks</h3>
          <div class="hook-swatches">
            ${swatch("--slds-g-color-accent-1")}
            ${swatch("--slds-g-color-accent-2")}
            ${swatch("--slds-g-color-accent-3")}
            ${swatch("--slds-g-color-border-1")}
            ${swatch("--slds-g-color-surface-1")}
          </div>
        </div>
        <footer class="slds-card__footer">
          <span class="slds-text-body_small">embedded-ai-slds2</span>
        </footer>
      </article>
    </div>
  </div>
`;
