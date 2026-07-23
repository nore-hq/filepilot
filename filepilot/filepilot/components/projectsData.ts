export interface Project {
    name: string;
    tag: string;
    tools: string[];
    color: string;
    imgSrc: string;
    challenge: string;
    solution: string;
    impact: string;
    github?: string;
    creator?: string;
}

export const projectList: Project[] = [
    {
        name: "VAULT 5.0",
        tag: "Operations & Analytics",
        tools: ["React 19", "Tailwind", "Recharts", "Node.js", "PostgreSQL", "Ollama (Llama 3)"],
        color: "bg-parchment text-noir",
        imgSrc: "/vault-5.png",
        challenge: "VAULT 5.0 is an advanced, full-stack Business Operations & Analytics platform. It natively supports multi-industry workflows (Manufacturing, SaaS, Logistics) and features an integrated AI Analyst to provide predictive insights, interactive chat, and comprehensive financial simulations.",
        solution: "Integrated an AI Engine powered by Ollama and Llama 3 with a React 19 and Node.js stack.",
        impact: "Delivers comprehensive financial simulations and predictive insights.",
        github: "https://github.com/nore-hq/VAULT-5.0",
        creator: "ALOK K L"
    },
    {
        name: "Bus Fleet Management",
        tag: "Logistics Dashboard",
        tools: ["React", "Vite", "Leaflet", "Tailwind", "PHP API"],
        color: "bg-parchment text-noir", 
        imgSrc: "/project-2.jpeg",
        challenge: "A comprehensive College Bus Fee Management System tailored for educational institutions. This system features role-based dashboards, interactive bus route mapping using Leaflet for students.",
        solution: "Implemented role-based access and integrated Leaflet maps for accurate bus route tracking.",
        impact: "Streamlines fleet tracking and fee management.",
        github: "https://github.com/nore-hq/fleet-management",
        creator: "ALOK K L"
    },
    {
        name: "CIVIC EYE",
        tag: "Public Service Platform",
        tools: ["React 19", "Vite", "Tailwind v4", "Framer Motion", "Leaflet", "Recharts", "Node.js", "PostgreSQL", "Ollama"],
        color: "bg-parchment text-noir",
        imgSrc: "/civic-eye.png",
        challenge: "Public grievance tracking system built with a React and Vite frontend and a Node.js and PostgreSQL backend. It allows citizens to report infrastructure issues and pinpoint exact locations using interactive maps.",
        solution: "Uses local AI (via Ollama) to automatically analyze the text of submitted grievances, extract relevant tags, determine priority level, and route tickets to the correct government department.",
        impact: "Eliminates the need for manual ticket sorting and speeds up response times.",
        github: "https://github.com/nore-hq/grievance-management-system",
        creator: "ALOK K L"
    },
    {
        name: "Toolbox Extension",
        tag: "Productivity Suite",
        tools: ["JavaScript", "Manifest V3", "Chrome APIs", "Lucide"],
        color: "bg-parchment text-noir",
        imgSrc: "/extension-grid.png", 
        challenge: "Users suffer from browser bloat, RAM drain, and severe context-switching when running dozens of single-purpose productivity extensions.",
        solution: "Architected a unified, lightweight Manifest V3 extension consolidating 11 essential tools—including a background Pomodoro timer, persistent scratchpad, DOM highlighter, and live color picker.",
        impact: "Replaced 11 standalone extensions with 1 seamless workspace.",
        github: "https://github.com/djvu2k6/toolbox-extension.git",
        creator: "DHANANJAY MOHAN"
    },
    {
        name: "GPU Allocator",
        tag: "Video Analytics",
        tools: ["Python", "React", "YOLO11", "TensorRT", "CUDA"],
        color: "bg-parchment text-noir",
        imgSrc: "/gpu-allocator.jpg", 
        challenge: "A real-time, GPU-accelerated multi-stream video analytics system that dynamically distributes multiple video feeds across a single GPU using YOLO11 + TensorRT inference.",
        solution: "Dynamically add or remove video sources (webcams, uploaded MP4s) and the system automatically rebalances GPU resources — no restart required.",
        impact: "Processes multiple concurrent video streams on a single NVIDIA GPU.",
        github: "https://github.com/nore-hq/multi-stream-gpu-allocator",
        creator: "ALOK K L"
    },
    {
        name: "FilePilot",
        tag: "Client Portal",
        tools: ["Next.js", "Supabase", "Tailwind CSS", "PostgreSQL"],
        color: "bg-parchment text-noir",
        imgSrc: "/filepilot.png", 
        challenge: "Agencies and freelancers need a secure, white-labeled way to deliver files, track project progress, and communicate with clients in real-time without relying on scattered tools.",
        solution: "Built a multi-tenant client portal with custom subdomains, role-based access (editor vs client), and real-time database syncing for instant messaging and progress updates.",
        impact: "Streamlines freelance and agency client management and file delivery.",
        github: "https://filepilot.norehq.com",
        creator: "ALOK K L"
    }
];
