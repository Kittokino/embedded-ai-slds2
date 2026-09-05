// SLDS 2 stylesheet: the real SLDS 2 bundle (component structure + Cosmos theme
// tokens + global styling hooks --slds-g-*) from @salesforce-ux/design-system-2.
// Icon sprites/images are still served from the SLDS 1 package via vite.config.ts.
import "@salesforce-ux/design-system-2/dist/css/bundled/slds2.cosmos.css";
import "./styles/app.css";

// Page markup lives in index.html. Interaction wiring for the AI Summary widget
// (#ai-summary) will go here once the desired behavior is defined.
