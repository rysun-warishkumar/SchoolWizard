import React from 'react';
import { Student } from '../../services/api/studentsService';
import './ChildSelector.css';

interface ChildSelectorProps {
  children: Student[];
  selectedChildId: number | null;
  onSelectChild: (childId: number) => void;
}

const ChildSelector: React.FC<ChildSelectorProps> = ({ children, selectedChildId, onSelectChild }) => {
  if (children.length === 0) {
    return null;
  }

  if (children.length === 1) {
    return (
      <div className="child-selector single-child">
        <div className="selected-child-info">
          <span className="child-name">
            {children[0].first_name} {children[0].last_name || ''}
          </span>
          <span className="child-class">
            {children[0].class_name} - {children[0].section_name}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="child-selector">
      <label className="child-selector-label">Select Child:</label>
      <select
        value={selectedChildId || ''}
        onChange={(e) => onSelectChild(Number(e.target.value))}
        className="child-selector-dropdown"
      >
        <option value="">-- Select a child --</option>
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.first_name} {child.last_name || ''} - {child.class_name} {child.section_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ChildSelector;

