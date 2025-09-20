// Simple toast notification system
export const toast = {
  success: (message: string) => {
    showToast(message, 'success');
  },
  error: (message: string) => {
    showToast(message, 'error');
  },
  info: (message: string) => {
    showToast(message, 'info');
  },
};

function showToast(message: string, type: 'success' | 'error' | 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `
    fixed top-4 right-4 z-50 max-w-md p-4 rounded-md shadow-lg transform translate-x-0 transition-all duration-300
    ${type === 'success' ? 'bg-green-500 text-white' : ''}
    ${type === 'error' ? 'bg-red-500 text-white' : ''}
    ${type === 'info' ? 'bg-blue-500 text-white' : ''}
  `.trim();
  
  toast.innerHTML = `
    <div class="flex items-center">
      <span class="flex-1">${message}</span>
      <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
        ×
      </button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(full)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
}

export default toast;