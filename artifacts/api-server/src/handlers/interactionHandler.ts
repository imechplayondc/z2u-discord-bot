import { BotClient } from "../bot/client.js";
import { botLog } from "../utils/logger.js";

// Buttons
import ticketClose from "../buttons/ticketClose.js";
import ticketClaim from "../buttons/ticketClaim.js";
import ticketTranscript from "../buttons/ticketTranscript.js";
import panelSetupType from "../buttons/panelSetupType.js";
import tradeSetup from "../buttons/tradeSetup.js";
import paymentProof from "../buttons/paymentProof.js";
import openTicket from "../buttons/openTicket.js";
import verifyProof from "../buttons/verifyProof.js";
import rejectProof from "../buttons/rejectProof.js";
import giveRole from "../buttons/giveRole.js";

// Modals
import panelSetupStep2 from "../modals/panelSetupStep2.js";
import panelSetupStep3 from "../modals/panelSetupStep3.js";
import ticketQuestions from "../modals/ticketQuestions.js";
import autoMMSetup from "../modals/autoMMSetup.js";
import tradeSetupModal from "../modals/tradeSetupModal.js";
import proofSubmit from "../modals/proofSubmit.js";
import embedCreate from "../modals/embedCreate.js";
import customCmdCreate from "../modals/customCmdCreate.js";

// Select Menus
import autoMMPayment from "../selectmenus/autoMMPayment.js";

const buttons = [
  ticketClose, ticketClaim, ticketTranscript,
  panelSetupType, tradeSetup, paymentProof,
  openTicket, verifyProof, rejectProof, giveRole,
];

const modals = [
  panelSetupStep2, panelSetupStep3, ticketQuestions,
  autoMMSetup, tradeSetupModal, proofSubmit,
  embedCreate, customCmdCreate,
];

const selectMenus = [autoMMPayment];

export async function loadButtons(client: BotClient) {
  for (const btn of buttons) {
    client.buttons.set(btn.customId as string, btn);
    botLog("info", `Loaded button: ${String(btn.customId)}`);
  }
}

export async function loadModals(client: BotClient) {
  for (const modal of modals) {
    client.modals.set(modal.customId as string, modal);
    botLog("info", `Loaded modal: ${modal.customId}`);
  }
}

export async function loadSelectMenus(client: BotClient) {
  for (const menu of selectMenus) {
    client.selectMenus.set(menu.customId as string, menu);
    botLog("info", `Loaded select menu: ${menu.customId}`);
  }
}
