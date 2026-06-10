"use client"; // Required because we use React state and event listeners

import { useState } from 'react';

export default function ComposePost() {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting post:", content);
    // TODO: Later, this will call the backend API (axios) to create a post
    setContent(''); // Clear the input after posting
  };

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex gap-3">
        <img 
          src="https://i.pravatar.cc/150?u=current_user" 
          alt="My Avatar" 
          className="w-10 h-10 rounded-full"
        />
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-transparent text-xl outline-none resize-none min-h-15 placeholder-gray-500"
            maxLength={280}
          />
          <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
            <div className="text-blue-500">
              {/* Media icons placeholders */}
              <span>🖼️</span> 
            </div>
            <button 
              type="submit"
              disabled={content.trim().length === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-4 rounded-full disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}