import React, { useState, useEffect } from 'react';
import { FaLinkedin } from "react-icons/fa";
import  TextareaAutosize from 'react-textarea-autosize';
import { PropagateLoader } from 'react-spinners';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Paywall } from './paywall/Paywall';
import { usePaywall } from '../context/PaywallProvider';
import { useUser } from '../context/UserProvder';
interface AdvocateProps {
  name: string;
  title: string;
  company: string;
  initials: string;
  linkedin?: string;
  isSelected: boolean;
  isLoading: boolean;
  isLoadingEmail: boolean;
  email: string;
  onCompose: () => void;
  onSendEmail: (e: React.FormEvent<HTMLFormElement>) => void;
  AIEmail: { subject: string; body: string } | null;
}

const Advocate: React.FC<AdvocateProps> = ({ name, title, company, initials, linkedin, isSelected, isLoading, onCompose, onSendEmail, AIEmail, isLoadingEmail, email }) => {
  const [emailContent, setEmailContent] = useState(AIEmail?.body || '');
  const [emailSubject, setEmailSubject] = useState(AIEmail?.subject || '');

  const { userEmails } = useUser();

  const { hasAccess, setSubscriptionTier } = usePaywall()

  const userHasAccess = hasAccess("premium") || userEmails.length <= 5

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

  useEffect(() => {
    if (AIEmail) {
      setEmailContent(AIEmail.body);
      setEmailSubject(AIEmail.subject);
    }
  }, [AIEmail]);

  return (
    <div className="flex flex-col gap-6 pr-3 bg-gray-100 p-3 rounded-lg">
      <div className={`flex items-center justify-between`}>
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700">{initials}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-medium">{name}</span>
        </div>
        {linkedin ? <a href={linkedin} target="_blank" rel="noopener noreferrer">
          <FaLinkedin className="w-6 h-6 text-blue-600 cursor-pointer" />
        </a> : <div className="w-6 h-6" />}
      </div>
      <div className="flex text-md text-black justify-between gap-6">
        <span className="font-bold">{company}</span>
        <span>{title}</span>
      </div>
      {isSelected && 
      <form className="flex flex-col gap-6" onSubmit={onSendEmail}>
        { isLoadingEmail ? <Skeleton className="w-full p-2 rounded-md border"/> : <TextareaAutosize
          name="subject"
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          placeholder="Your Subject here.."
          className="w-full p-2 border rounded-md bg-white"
          autoCorrect="on"
          minRows={1}
        />}
        {isLoadingEmail ? <Skeleton className="w-full p-2 rounded-md border h-[500px]"  /> : <TextareaAutosize
          name="content"
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
          placeholder="Write your email here..."
          className="w-full p-2 border rounded-md bg-white"
          minRows={15}
        />}
        <Paywall
          isLocked={!userHasAccess}
          onSubscribe={handleSubscribe}
        >
          <button disabled={isLoading} type="submit" className="text-centerw-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
            {isLoading ? 
            <PropagateLoader color="#fff" size={10} className="p-3"/> : <span>Send Email</span>}
          </button>
        </Paywall>
      </form>
      }
      {!isSelected && <div className="flex">
        <button 
          onClick={onCompose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Compose Email
        </button>
      </div>}
    </div>
  );
};

export default Advocate;
