import { useState } from "react";

import ConfirmModal from "../components/controls/ConfirmModal";

import { ConfirmRequest } from "../types/controls";

// Shared plumbing for "pause and ask before acting", where callers describe
// the pending decision via requestConfirm(). Every action's onClick auto-closes
// the modal afterward, so call sites just supply the logic. Then render the
// returned `confirmModal` wherever they'd otherwise render <ConfirmModal>
export function useConfirmModal() {
    const [pendingConfirm, setPendingConfirm] = useState<ConfirmRequest | null>(null);
    const closeConfirm = () => setPendingConfirm(null);

    const requestConfirm = (confirm: ConfirmRequest) => {
        setPendingConfirm({
            ...confirm,
            actions: confirm.actions.map((action) => ({
                ...action,
                onClick: () => {
                    action.onClick();
                    closeConfirm();
                },
            })),
        });
    };

    const confirmModal = pendingConfirm ? (
        <ConfirmModal
            title={pendingConfirm.title}
            message={pendingConfirm.message}
            actions={pendingConfirm.actions}
            onClose={closeConfirm}
        />
    ) : null;

    return { requestConfirm, confirmModal };
}