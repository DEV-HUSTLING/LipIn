import React,{useEffect, useState} from 'react'

export const browserTheme =()=> {
    const [theme, setTheme] = useState("light");
    useEffect(() => {
    
        // Function to detect theme from the actual page
        const detectPageTheme = () => {
          // Method 1: Check LinkedIn's body background color
          const body = document.body;
          if (body) {
            const computedStyle = window.getComputedStyle(body);
            const bgColor = computedStyle.backgroundColor;
            
            // Parse RGB values
            const rgbMatch = bgColor.match(/\d+/g);
            if (rgbMatch && rgbMatch.length >= 3) {
              const r = parseInt(rgbMatch[0]);
              const g = parseInt(rgbMatch[1]);
              const b = parseInt(rgbMatch[2]);
              
              // Calculate luminance (perceived brightness)
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              
              // If luminance is less than 0.5, it's likely dark mode
              return luminance < 0.5 ? "dark" : "light";
            }
          }
          
          // Method 2: Check for LinkedIn dark mode class/attribute
          if (body) {
            // LinkedIn uses data-theme or similar attributes
            const themeAttr = body.getAttribute('data-theme') || 
                             body.getAttribute('data-mode') ||
                             document.documentElement.getAttribute('data-theme') ||
                             document.documentElement.getAttribute('data-mode');
            if (themeAttr) {
              return themeAttr.toLowerCase().includes('dark') ? "dark" : "light";
            }
            
            // Check for dark mode classes
            if (body.classList.contains('dark') || 
                body.classList.contains('dark-mode') ||
                document.documentElement.classList.contains('dark') ||
                document.documentElement.classList.contains('dark-mode')) {
              return "dark";
            }
          }
          
          // Method 3: Fallback to system preference
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          return mediaQuery.matches ? "dark" : "light";
        };
    
        // Wait a bit for page to load, then detect theme
        const detectTheme = () => {
          const detectedTheme = detectPageTheme();
          setTheme(detectedTheme);
        };
    
        // Initial detection with a small delay to ensure page is loaded
        const timeoutId = setTimeout(detectTheme, 100);
        
        // Also try immediately in case page is already loaded
        detectTheme();
    
        // Create a MutationObserver to watch for theme changes
        const observer = new MutationObserver(() => {
          detectTheme();
        });
    
        // Observe body and html for attribute/class changes
        if (document.body) {
          observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'data-theme', 'data-mode'],
            childList: false,
            subtree: false
          });
        }
        if (document.documentElement) {
          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme', 'data-mode'],
            childList: false,
            subtree: false
          });
        }
    
        // Also listen to system preference changes as backup
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const mediaListener = () => {
          // Re-detect from page first, fallback to system preference
          const pageTheme = detectPageTheme();
          if (pageTheme) {
            setTheme(pageTheme);
          } else {
            setTheme(mediaQuery.matches ? "dark" : "light");
          }
        };
        mediaQuery.addEventListener("change", mediaListener);
    
        return () => {
          clearTimeout(timeoutId);
          observer.disconnect();
          mediaQuery.removeEventListener("change", mediaListener);
        };
      }, []);
  return theme
}

