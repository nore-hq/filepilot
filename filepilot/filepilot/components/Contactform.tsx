"use client";

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';

const ContactForm = () => {
    // Replace 'YOUR_FORM_ID' with the ID you get from Formspree.io
    const [state, handleSubmit] = useForm("YOUR_FORM_ID");

    if (state.succeeded) {
        return (
            <div className="text-center py-20 animate-in fade-in duration-700">
                <h3 className="text-4xl font-black uppercase tracking-tighter text-parchment">
                    Inquiry Received.
                </h3>
                <p className="mt-4 text-tarantino font-bold uppercase tracking-widest">
                    We will be in touch shortly.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl mx-auto py-10">
            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-parchment/50">
                    Email Address
                </label>
                <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    className="bg-transparent border-b-2 border-parchment py-4 text-2xl outline-none focus:border-tarantino transition-colors text-parchment"
                    placeholder="your@email.com"
                />
                <ValidationError prefix="Email" field="email" errors={state.errors} />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-parchment/50">
                    Project Brief
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="bg-transparent border-b-2 border-parchment py-4 text-xl outline-none focus:border-tarantino transition-colors text-parchment resize-none"
                    placeholder="Tell us about the problem we're solving..."
                />
                <ValidationError prefix="Message" field="message" errors={state.errors} />
            </div>

            <button
                type="submit"
                disabled={state.submitting}
                className="mt-6 bg-parchment text-noir py-5 font-black uppercase tracking-widest hover:bg-tarantino transition-all active:scale-95 disabled:opacity-50"
            >
                {state.submitting ? "Sending..." : "Submit Inquiry"}
            </button>
        </form>
    );
};

export default ContactForm;