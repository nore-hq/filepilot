import React from 'react';
import { Layout, Database, Zap } from 'lucide-react';

interface Service {
    title: string;
    desc: string;
    icon: React.ReactNode;
}

const services: Service[] = [
    {
        title: "Custom Web Applications",
        desc: "Custom web applications designed for business requirements.",
        icon: <Layout size={32} />
    },
    {
        title: "SaaS Development",
        desc: "Development and deployment of scalable software products.",
        icon: <Database size={32} />
    },
    {
        title: "AI & Automation",
        desc: "Automated systems for improved process efficiency.",
        icon: <Zap size={32} />
    }
];

const Services = () => {
    return (
        // STRIPPED: Removed bg-parchment and overflow-hidden
        <section id="services" className="px-6 md:px-10 py-32 border-t border-b border-noir/10 relative">
            
            <div className="grid md:grid-cols-3 gap-0 border border-noir relative z-10">
                {services.map((s, i) => (
                    <div
                        key={i}
                        className="p-12 border-b md:border-b-0 md:border-r border-noir last:border-r-0 hover:bg-tarantino transition-colors group cursor-default bg-parchment/50 backdrop-blur-sm"
                    >
                        <div className="mb-8 group-hover:scale-110 transition-transform duration-300">
                            {s.icon}
                        </div>
                        <h3 className="text-2xl font-bold uppercase mb-4 text-noir">
                            {s.title}
                        </h3>
                        <p className="font-medium opacity-70 text-noir">
                            {s.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Services;