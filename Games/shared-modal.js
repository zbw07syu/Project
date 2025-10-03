/**
 * Shared Modal System for Long Multiple-Choice Options
 * 
 * This utility provides a modal system for displaying multiple-choice options
 * when they are too long to fit in the standard game layout.
 * 
 * Usage:
 * 1. Include this script in your game's HTML
 * 2. Call createMultipleChoiceModal() to create the modal
 * 3. Use showOptionsModal() to display options in a modal
 * 4. Use showOptionsInline() to display options normally
 */

(function(window) {
  'use strict';

  // Configuration
  const CONFIG = {
    maxCharactersInline: 50,  // Max characters before triggering modal
    maxWidthInline: 200,      // Max pixel width before triggering modal (approximate)
    maxWordsInline: 3,        // Max words before triggering modal
    modalZIndex: 10000,       // High z-index to appear above game elements
  };

  let modalContainer = null;
  let currentCallback = null;

  /**
   * Create the modal HTML structure and inject it into the page
   */
  function createMultipleChoiceModal() {
    if (modalContainer) return; // Already created

    modalContainer = document.createElement('div');
    modalContainer.id = 'multipleChoiceModal';
    modalContainer.className = 'mc-modal-overlay';
    modalContainer.innerHTML = `
      <div class="mc-modal-content">
        <div class="mc-modal-header">
          <h3 class="mc-modal-title">Question</h3>
          <button class="mc-modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="mc-modal-body">
          <div class="mc-modal-question"></div>
          <div class="mc-modal-options"></div>
          <div class="mc-modal-answer"></div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .mc-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: ${CONFIG.modalZIndex};
        font-family: 'Bangers', cursive, Arial, sans-serif;
      }

      .mc-modal-overlay.show {
        display: flex;
      }

      .mc-modal-content {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        animation: modalSlideIn 0.3s ease-out;
        border: 3px solid #333;
      }

      @keyframes modalSlideIn {
        from {
          transform: scale(0.8) translateY(-20px);
          opacity: 0;
        }
        to {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }

      .mc-modal-header {
        background: linear-gradient(135deg, #4a90e2, #357abd);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #333;
      }

      .mc-modal-title {
        margin: 0;
        font-size: 24px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }

      .mc-modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }

      .mc-modal-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      .mc-modal-body {
        padding: 20px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .mc-modal-question {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #333;
        line-height: 1.4;
        text-align: center;
      }

      .mc-modal-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mc-modal-answer {
        margin-top: 20px;
        padding: 15px;
        background: #f0f8ff;
        border: 2px solid #4a90e2;
        border-radius: 8px;
        font-size: 18px;
        font-weight: bold;
        color: #333;
        text-align: center;
        display: none;
        line-height: 1.4;
      }

      .mc-modal-answer.show {
        display: block;
      }

      .mc-modal-option {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border: 2px solid #333;
        border-radius: 8px;
        padding: 15px 20px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        line-height: 1.4;
        min-height: 50px;
        display: flex;
        align-items: center;
        word-wrap: break-word;
        hyphens: auto;
      }

      .mc-modal-option:hover {
        background: linear-gradient(135deg, #e3f2fd, #bbdefb);
        border-color: #4a90e2;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
      }

      .mc-modal-option:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(74, 144, 226, 0.3);
      }

      .mc-modal-option:focus {
        outline: none;
        border-color: #4a90e2;
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .mc-modal-content {
          max-width: 95vw;
          margin: 10px;
        }

        .mc-modal-title {
          font-size: 20px;
        }

        .mc-modal-question {
          font-size: 16px;
        }

        .mc-modal-option {
          font-size: 14px;
          padding: 12px 16px;
        }
      }

      /* Accessibility improvements */
      @media (prefers-reduced-motion: reduce) {
        .mc-modal-content {
          animation: none;
        }
        
        .mc-modal-option {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modalContainer);

    // Event listeners
    const closeBtn = modalContainer.querySelector('.mc-modal-close');
    closeBtn.addEventListener('click', closeModal);

    // Close on overlay click
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalContainer.classList.contains('show')) {
        closeModal();
      }
    });
  }

  /**
   * Close the modal
   */
  function closeModal() {
    if (modalContainer) {
      // Update modal state tracking
      if (window.modalState !== undefined) {
        window.modalState = 'closing';
      }
      
      modalContainer.classList.remove('show');
      currentCallback = null;
      
      // Clear modal content
      const answerEl = modalContainer.querySelector('.mc-modal-answer');
      if (answerEl) {
        // Use innerHTML to properly clear all child elements including buttons
        answerEl.innerHTML = '';
        answerEl.classList.remove('show');
      }
      
      // Also clear options
      const optionsEl = modalContainer.querySelector('.mc-modal-options');
      if (optionsEl) {
        optionsEl.innerHTML = '';
      }
      
      // Clear focus from modal elements to prevent interference
      const activeElement = document.activeElement;
      if (activeElement && modalContainer.contains(activeElement)) {
        activeElement.blur();
      }
      
      // Set modal state to closed after transition completes
      setTimeout(() => {
        if (window.modalState !== undefined) {
          window.modalState = 'closed';
        }
        
        console.log('🔔 Modal system: Dispatching modalClosed event, state:', window.modalState);
        
        // Dispatch a custom event to notify the game that modal is closed
        window.dispatchEvent(new CustomEvent('modalClosed', { 
          detail: { timestamp: Date.now(), fromModal: true } 
        }));
        
        console.log('🔔 Modal system: modalClosed event dispatched');
      }, 150); // Reduced from 300ms to 150ms for faster state updates
    }
  }

  /**
   * Show answer in the modal and replace options with a close button
   * @param {string} answerText - The answer text to display
   * @param {function} onClose - Callback function when close button is clicked
   * @param {object} options - Optional configuration
   * @param {boolean} options.showCorrectIncorrect - Show Correct/Incorrect buttons instead of Close
   * @param {function} options.onCorrect - Callback when Correct is clicked
   * @param {function} options.onIncorrect - Callback when Incorrect is clicked
   */
  function showAnswerInModal(answerText, onClose, options = {}) {
    if (!modalContainer) return;
    
    console.log('🔔 showAnswerInModal called with:', { answerText, hasCallback: !!onClose });
    
    const answerEl = modalContainer.querySelector('.mc-modal-answer');
    const optionsEl = modalContainer.querySelector('.mc-modal-options');
    
    if (answerEl && optionsEl) {
      // Clear the options section
      optionsEl.innerHTML = '';
      
      // Clear any existing content in answer element (including old buttons)
      answerEl.innerHTML = '';
      
      // Show the answer text
      const answerTextNode = document.createTextNode(answerText);
      answerEl.appendChild(answerTextNode);
      answerEl.classList.add('show');
      
      if (options.showCorrectIncorrect) {
        // Create Correct and Incorrect buttons
        const correctBtn = document.createElement('button');
        correctBtn.textContent = 'Correct';
        correctBtn.className = 'mc-modal-option correct-btn';
        correctBtn.style.cssText = 'background: linear-gradient(135deg, #4caf50, #45a049); color: white; font-size: 16px; margin-top: 15px; padding: 12px 20px; min-height: 45px;';
        
        const incorrectBtn = document.createElement('button');
        incorrectBtn.textContent = 'Incorrect';
        incorrectBtn.className = 'mc-modal-option incorrect-btn';
        incorrectBtn.style.cssText = 'background: linear-gradient(135deg, #f44336, #da190b); color: white; font-size: 16px; margin-top: 15px; padding: 12px 20px; min-height: 45px;';
        
        correctBtn.addEventListener('click', () => {
          if (options.onCorrect) {
            options.onCorrect();
          }
        });
        
        incorrectBtn.addEventListener('click', () => {
          closeModal();
          if (options.onIncorrect) {
            setTimeout(() => options.onIncorrect(), 200);
          }
        });
        
        // Append buttons to the answer container
        answerEl.appendChild(correctBtn);
        answerEl.appendChild(incorrectBtn);
      } else {
        // Create a close button and add it AFTER the answer (inside the answer container)
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.className = 'mc-modal-option';
        closeBtn.style.cssText = 'background: linear-gradient(135deg, #4a90e2, #357abd); color: white; font-size: 14px; margin-top: 15px; padding: 10px 20px; min-height: 40px; display: block; width: 100%;';
        
        closeBtn.addEventListener('click', () => {
          console.log('🔔 Modal Close button clicked');
          closeModal();
          if (onClose) {
            console.log('🔔 Scheduling callback execution in 500ms (after modal fully closes)');
            setTimeout(() => {
              console.log('🔔 Executing onClose callback now, modal state:', window.modalState);
              try {
                onClose();
                console.log('🔔 ✅ Callback executed successfully');
              } catch (error) {
                console.error('❌ Error executing modal onClose callback:', error);
              }
            }, 500); // Increased from 200ms to 500ms to ensure modal is fully closed
          } else {
            console.warn('⚠️ No onClose callback provided to modal');
          }
        });
        
        // Add a line break before the button
        answerEl.appendChild(document.createElement('br'));
        answerEl.appendChild(document.createElement('br'));
        
        // Append close button to the answer container (below the answer text)
        answerEl.appendChild(closeBtn);
        
        console.log('🔔 Close button created and appended to modal');
      }
    }
  }

  /**
   * Check if options should be displayed in modal based on length and word count
   * @param {string[]} options - Array of option strings
   * @returns {boolean} - True if modal should be used
   */
  function shouldUseModal(options) {
    if (!Array.isArray(options) || options.length === 0) return false;

    // Check if any option is too long or has too many words
    return options.some(option => {
      const text = String(option || '');
      const wordCount = text.trim().split(/\s+/).length;
      
      return text.length > CONFIG.maxCharactersInline || 
             (text.length * 8) > CONFIG.maxWidthInline || // Rough character width estimation
             wordCount > CONFIG.maxWordsInline; // More than configured words triggers modal
    });
  }

  /**
   * Display options in a modal
   * @param {string} question - The question text
   * @param {string[]} options - Array of option strings
   * @param {function} callback - Function to call when option is selected
   */
  function showOptionsModal(question, options, callback) {
    if (!modalContainer) {
      createMultipleChoiceModal();
    }

    console.log('🔔 showOptionsModal called, current modal state:', window.modalState);

    // If modal is currently closing, wait for it to finish before opening again
    if (window.modalState === 'closing') {
      console.log('🔔 Modal is closing, waiting 400ms before opening new question');
      setTimeout(() => showOptionsModal(question, options, callback), 400);
      return;
    }

    // Update modal state tracking
    if (window.modalState !== undefined) {
      window.modalState = 'opening';
    }

    currentCallback = callback;

    // Set question text
    const questionEl = modalContainer.querySelector('.mc-modal-question');
    questionEl.textContent = question || '';

    // Hide answer section initially (it will be shown after option selection)
    const answerEl = modalContainer.querySelector('.mc-modal-answer');
    if (answerEl) {
      // Use innerHTML to properly clear all child elements including buttons
      answerEl.innerHTML = '';
      answerEl.classList.remove('show');
    }

    // Create option buttons
    const optionsEl = modalContainer.querySelector('.mc-modal-options');
    optionsEl.innerHTML = '';

    options.forEach((option, index) => {
      const optionBtn = document.createElement('button');
      optionBtn.className = 'mc-modal-option';
      optionBtn.textContent = option;
      optionBtn.setAttribute('data-option', option);
      optionBtn.setAttribute('data-index', index);
      
      optionBtn.addEventListener('click', () => {
        console.log('🔔 Modal system: Option clicked:', option, 'index:', index);
        
        // CRITICAL FIX: Don't close modal yet - let the callback show the answer first
        const savedCallback = currentCallback;
        
        if (savedCallback) {
          console.log('🔔 Modal system: Executing callback with:', option, index);
          savedCallback(option, index);  // Execute callback immediately to show answer in modal
        } else {
          console.warn('🔔 Modal system: No callback was saved!');
          closeModal(); // Only close if no callback
        }
      });


      optionsEl.appendChild(optionBtn);
    });

    // Show modal
    modalContainer.classList.add('show');

    // Update modal state to 'open' after transition completes
    setTimeout(() => {
      if (window.modalState !== undefined) {
        window.modalState = 'open';
      }
    }, 300); // CSS transition duration

    // Focus first option for accessibility
    const firstOption = optionsEl.querySelector('.mc-modal-option');
    if (firstOption) {
      setTimeout(() => firstOption.focus(), 100);
    }
  }

  /**
   * Show open-answer question in modal with "Show Answer" button
   * @param {string} question - The question text
   * @param {string} answer - The answer text
   * @param {string[]} alternates - Array of alternate answers
   * @param {object} callbacks - Callback functions
   * @param {function} callbacks.onCorrect - Called when Correct is clicked
   * @param {function} callbacks.onIncorrect - Called when Incorrect is clicked
   */
  function showOpenAnswerModal(question, answer, alternates, callbacks = {}) {
    if (!modalContainer) {
      createMultipleChoiceModal();
    }

    // Update modal state tracking
    if (window.modalState !== undefined) {
      window.modalState = 'opening';
    }

    // Set question text
    const questionEl = modalContainer.querySelector('.mc-modal-question');
    questionEl.textContent = question || '';

    // Hide answer section initially (it will be shown after "Show Answer" is clicked)
    const answerEl = modalContainer.querySelector('.mc-modal-answer');
    if (answerEl) {
      answerEl.textContent = '';
      answerEl.classList.remove('show');
    }

    // Create "Show Answer" button
    const optionsEl = modalContainer.querySelector('.mc-modal-options');
    optionsEl.innerHTML = '';

    const showAnswerBtn = document.createElement('button');
    showAnswerBtn.textContent = 'Show Answer';
    showAnswerBtn.className = 'mc-modal-option answer-btn';
    showAnswerBtn.style.cssText = 'background: linear-gradient(135deg, #4a90e2, #357abd); color: white; font-size: 18px;';
    
    showAnswerBtn.addEventListener('click', () => {
      console.log('🔔 Modal system: Show Answer clicked');
      
      // Build answer text with alternates
      const alt = Array.isArray(alternates) ? alternates.filter(a => a && a.trim() !== '') : [];
      const altSuffix = alt.length ? `\n(Also accepted: ${alt.join(', ')})` : '';
      const answerText = `Answer: ${answer}${altSuffix}`;
      
      // Show answer in modal with Correct/Incorrect buttons
      showAnswerInModal(answerText, null, {
        showCorrectIncorrect: true,
        onCorrect: callbacks.onCorrect,
        onIncorrect: callbacks.onIncorrect
      });
    });

    optionsEl.appendChild(showAnswerBtn);

    // Show modal
    modalContainer.classList.add('show');

    // Update modal state to 'open' after transition completes
    setTimeout(() => {
      if (window.modalState !== undefined) {
        window.modalState = 'open';
      }
    }, 300);

    // Focus the show answer button
    setTimeout(() => showAnswerBtn.focus(), 100);
  }

  /**
   * Show Continue/Pass buttons in modal after correct answer
   * @param {string} message - Message to display (e.g., "Correct! +10 points")
   * @param {object} callbacks - Callback functions
   * @param {function} callbacks.onContinue - Called when Continue is clicked
   * @param {function} callbacks.onPass - Called when Pass is clicked
   */
  function showContinuePassModal(message, callbacks = {}) {
    if (!modalContainer) return;
    
    const answerEl = modalContainer.querySelector('.mc-modal-answer');
    const optionsEl = modalContainer.querySelector('.mc-modal-options');
    
    if (answerEl && optionsEl) {
      // Clear the options section
      optionsEl.innerHTML = '';
      
      // Show the message
      answerEl.textContent = message;
      answerEl.classList.add('show');
      
      // Create Continue and Pass buttons
      const continueBtn = document.createElement('button');
      continueBtn.textContent = 'Continue';
      continueBtn.className = 'mc-modal-option continue-btn';
      continueBtn.style.cssText = 'background: linear-gradient(135deg, #4caf50, #45a049); color: white; font-size: 16px; margin-top: 15px; padding: 12px 20px; min-height: 45px;';
      
      const passBtn = document.createElement('button');
      passBtn.textContent = 'Pass';
      passBtn.className = 'mc-modal-option pass-btn';
      passBtn.style.cssText = 'background: linear-gradient(135deg, #ff9800, #f57c00); color: white; font-size: 16px; margin-top: 15px; padding: 12px 20px; min-height: 45px;';
      
      continueBtn.addEventListener('click', () => {
        closeModal();
        if (callbacks.onContinue) {
          setTimeout(() => callbacks.onContinue(), 200);
        }
      });
      
      passBtn.addEventListener('click', () => {
        closeModal();
        if (callbacks.onPass) {
          setTimeout(() => callbacks.onPass(), 200);
        }
      });
      
      // Append buttons to the answer container
      answerEl.appendChild(continueBtn);
      answerEl.appendChild(passBtn);
    }
  }

  /**
   * Display options inline (normal game behavior)
   * @param {HTMLElement} container - Container element to add buttons to
   * @param {string[]} options - Array of option strings
   * @param {function} callback - Function to call when option is selected
   * @param {string} buttonClass - CSS class for option buttons
   */
  function showOptionsInline(container, options, callback, buttonClass = 'option-btn') {
    if (!container) return;

    container.innerHTML = '';

    options.forEach((option, index) => {
      const optionBtn = document.createElement('button');
      optionBtn.textContent = option;
      optionBtn.className = buttonClass;
      optionBtn.setAttribute('data-option', option);
      optionBtn.setAttribute('data-index', index);
      
      optionBtn.addEventListener('click', () => {
        if (callback) {
          callback(option, index);
        }
      });

      container.appendChild(optionBtn);
    });
  }

  /**
   * Smart option display - automatically chooses modal or inline based on option length
   * @param {HTMLElement} container - Container element for inline display
   * @param {string} question - The question text (used for modal)
   * @param {string[]} options - Array of option strings
   * @param {function} callback - Function to call when option is selected
   * @param {string} buttonClass - CSS class for inline option buttons
   */
  function displayOptions(container, question, options, callback, buttonClass = 'option-btn') {
    if (!Array.isArray(options) || options.length === 0) return;

    if (shouldUseModal(options)) {
      showOptionsModal(question, options, callback);
    } else {
      showOptionsInline(container, options, callback, buttonClass);
    }
  }

  // Export functions to global scope
  window.MultipleChoiceModal = {
    createModal: createMultipleChoiceModal,
    shouldUseModal: shouldUseModal,
    showModal: showOptionsModal,
    showOpenAnswerModal: showOpenAnswerModal,
    showAnswerInModal: showAnswerInModal,
    showContinuePassModal: showContinuePassModal,
    showInline: showOptionsInline,
    displayOptions: displayOptions,
    closeModal: closeModal,
    config: CONFIG
  };

})(window);