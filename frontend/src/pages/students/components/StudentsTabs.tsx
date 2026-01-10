import React, { useRef, useEffect, useState } from 'react';

interface StudentsTabsProps {
  activeTab: 'list' | 'admission' | 'online-admissions' | 'categories' | 'houses' | 'disable-reasons' | 'promote';
  onTabChange: (tab: 'list' | 'admission' | 'online-admissions' | 'categories' | 'houses' | 'disable-reasons' | 'promote') => void;
}

const StudentsTabs: React.FC<StudentsTabsProps> = ({ activeTab, onTabChange }) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Scroll to active tab
  const scrollToActiveTab = () => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      
      const scrollLeft = container.scrollLeft;
      const tabLeft = tabRect.left - containerRect.left + scrollLeft;
      const tabWidth = tabRect.width;
      const containerWidth = containerRect.width;
      
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  // Check if arrows should be visible
  const checkArrows = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      } else {
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    }
  };

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollAmount = 250;
      const currentScroll = container.scrollLeft;
      const newScrollLeft = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount);
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
      
      setTimeout(() => {
        checkArrows();
      }, 300);
    }
  };

  // Initialize and check arrows
  useEffect(() => {
    checkArrows();
    scrollToActiveTab();
  }, []);

  // Check arrows on scroll and window resize
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      checkArrows();
      container.addEventListener('scroll', checkArrows);
      window.addEventListener('resize', checkArrows);
      
      const resizeObserver = new ResizeObserver(() => {
        checkArrows();
      });
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkArrows);
        window.removeEventListener('resize', checkArrows);
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

  return (
    <div className="students-tabs-wrapper">
      <div className="students-tabs-container">
        {showLeftArrow && (
          <button
            className="students-tabs-arrow students-tabs-arrow-left"
            onClick={() => scrollTabs('left')}
            aria-label="Scroll tabs left"
          >
            ‹
          </button>
        )}
        <div className="students-tabs" ref={tabsContainerRef}>
          <button
            ref={activeTab === 'list' ? activeTabRef : null}
            className={activeTab === 'list' ? 'active' : ''}
            onClick={() => onTabChange('list')}
          >
            Student List
          </button>
          <button
            ref={activeTab === 'admission' ? activeTabRef : null}
            className={activeTab === 'admission' ? 'active' : ''}
            onClick={() => onTabChange('admission')}
          >
            Student Admission
          </button>
          <button
            ref={activeTab === 'online-admissions' ? activeTabRef : null}
            className={activeTab === 'online-admissions' ? 'active' : ''}
            onClick={() => onTabChange('online-admissions')}
          >
            Online Admissions
          </button>
          <button
            ref={activeTab === 'categories' ? activeTabRef : null}
            className={activeTab === 'categories' ? 'active' : ''}
            onClick={() => onTabChange('categories')}
          >
            Categories
          </button>
          <button
            ref={activeTab === 'houses' ? activeTabRef : null}
            className={activeTab === 'houses' ? 'active' : ''}
            onClick={() => onTabChange('houses')}
          >
            Houses
          </button>
          <button
            ref={activeTab === 'disable-reasons' ? activeTabRef : null}
            className={activeTab === 'disable-reasons' ? 'active' : ''}
            onClick={() => onTabChange('disable-reasons')}
          >
            Disable Reasons
          </button>
          <button
            ref={activeTab === 'promote' ? activeTabRef : null}
            className={activeTab === 'promote' ? 'active' : ''}
            onClick={() => onTabChange('promote')}
          >
            Promote Students
          </button>
        </div>
        {showRightArrow && (
          <button
            className="students-tabs-arrow students-tabs-arrow-right"
            onClick={() => scrollTabs('right')}
            aria-label="Scroll tabs right"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentsTabs;
