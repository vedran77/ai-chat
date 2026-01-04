import { SafetyResources } from '../../types';
import { Heart, Phone, ExternalLink, X } from 'lucide-react';

interface Props {
  resources: SafetyResources;
  onClose: () => void;
}

export default function SafetyAlert({ resources, onClose }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mx-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-amber-800">Support Resources</h3>
        </div>
        <button
          onClick={onClose}
          className="text-amber-600 hover:text-amber-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-amber-700 text-sm mb-4">{resources.message}</p>

      <div className="space-y-3">
        {resources.resources.map((resource, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-3 border border-amber-100"
          >
            <div className="font-medium text-gray-900">{resource.name}</div>
            <p className="text-sm text-gray-500">{resource.description}</p>
            <div className="flex gap-3 mt-2">
              {resource.phone && (
                <a
                  href={`tel:${resource.phone}`}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  {resource.phone}
                </a>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
