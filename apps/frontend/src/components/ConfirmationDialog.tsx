import React from 'react';
import { PropagateLoader } from 'react-spinners';
import { Paywall } from './paywall/Paywall';
import { usePaywall } from '../context/PaywallProvider';
interface ConfirmationDialogProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ 
  onClose, 
  onConfirm, 
  isLoading,
}) => {
  const { hasAccess, setSubscriptionTier } = usePaywall()

  const userHasAccess = hasAccess("premium")

  const handleSubscribe = (plan: string) => {
    console.log(`Processing subscription for plan: ${plan}`)
    // In a real app, you would redirect to a payment processor
    // For demo purposes, we'll just update the subscription tier
    if (plan.includes("premium")) {
      setSubscriptionTier("premium")
    } else {
      setSubscriptionTier("basic")
    }
  }

  if (!isLoading) {
    return (
      <div className="p-4 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-6 text-center">
          Do you want to contact potential advocates at this company?
        </h2>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            No
          </button>
        </div>
        <Paywall
          title="Premium Feature Locked"
          description="Subscribe to unlock this premium feature"
          isLocked={!userHasAccess}
          onSubscribe={handleSubscribe}
        >
          <div>
            <h2>
              You need to be a paid user to contact potential advocates at this company.
            </h2>
          </div>
        </Paywall>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="text-center py-4">
        <PropagateLoader color="#000000" size={10} className="p-3" />
        <p>Finding potential advocates...</p>
      </div>
    </div>
  );
};

export default ConfirmationDialog;