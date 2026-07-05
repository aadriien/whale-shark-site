import { useEffect } from "react";

import { ConfirmModalProps } from "../../types/controls";

// Generic pop-up for confirming a decision with 1+ possible actions
// e.g. a plain confirm / cancel, a choice of several outcomes, etc
const ConfirmModal = ({ title, message, actions, onClose }: ConfirmModalProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
                {title && <h4 className="confirm-modal-title">{title}</h4>}
                <p className="confirm-modal-message">{message}</p>

                <div className="confirm-modal-actions">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            className={`confirm-modal-button ${action.variant ?? "neutral"}`}
                            onClick={action.onClick}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;