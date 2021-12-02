import React from 'react';
import  PropTypes  from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function BottomBtn({ text, colorClass, icon, onBtnClick }) {
    
    return (
        <button
            type="button"
            className={`btn btn-block no-border c-btn ${colorClass}`}
            onClick={onBtnClick}
        >
            <FontAwesomeIcon 
                icon={icon}
                size="lg"
                title={text}
            />
            <span className="ms-2">{text}</span>
        </button>
    );
}

BottomBtn.propTypes = {
    text:PropTypes.string,
    colorClass:PropTypes.string,
    icon:PropTypes.object,
    onBtnClick:PropTypes.func
}

BottomBtn.defaultProps = {
    text:'新建'
}