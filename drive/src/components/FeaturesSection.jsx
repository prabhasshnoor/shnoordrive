import React from 'react';
import { Search, Users, Shield, Link, CloudOff, RefreshCw } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
      <Icon size={24} strokeWidth={2} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">
      {description}
    </p>
  </div>
);

const FeaturesSection = () => {
  const features = [
    {
      icon: Search,
      title: "Powerful Search",
      description: "Find files faster with AI-powered search that recognizes objects in images and text in scanned documents."
    },
    {
      icon: Users,
      title: "Seamless Collaboration",
      description: "Work together in real-time. Share files and folders easily with granular access controls and commenting."
    },
    {
      icon: Shield,
      title: "Enterprise-grade Security",
      description: "Keep your files safe with advanced encryption, built-in protections against malware, spam, and ransomware."
    },
    {
      icon: Link,
      title: "App Integrations",
      description: "Connect with the tools you already use. Seamlessly integrate with hundreds of third-party apps."
    },
    {
      icon: CloudOff,
      title: "Offline Access",
      description: "Make files available offline so you can view and edit them even when you're not connected to the internet."
    },
    {
      icon: RefreshCw,
      title: "Automated Backup",
      description: "Never lose a file again. Automatically backup folders from your computer directly to the cloud."
    }
  ];

  return (
    <div id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
            Everything you need to get things done
          </h2>
          <p className="text-lg text-slate-600">
            Shnoor Drive integrates seamlessly with Docs, Sheets, and Slides, cloud-native apps that enable your team to collaborate effectively in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
