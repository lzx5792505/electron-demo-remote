import React from 'react';
import  PropTypes  from 'prop-types';
import classNames from 'classnames';
import './TabList.scss'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

export default function TabList({ files, activeId, unsaveIds, onTabClick, onCloseTab }) {

    return (
        <ul className="nav nav-pills tablist-component">
            {
                files.map(file => {
                    const withUnsavedMark = unsaveIds.includes(file.id)
                    const fClassname = classNames({
                        'nav-link':true,
                        'active':file.id === activeId,
                        'withUnsaved':withUnsavedMark
                    })
                    return (
                        <li 
                            className="nav-item"
                            key={ file.id }
                        >
                            <a href="www.test" 
                                className={fClassname}
                                onClick={(e) => {e.preventDefault();e.stopPropagation();onTabClick(file.id)}}
                            >
                                { file.title }
                                <span 
                                    className="ms-2 close-icon"
                                    onClick={(e) => {e.preventDefault();e.stopPropagation();onCloseTab(file.id)}}
                                >
                                    <FontAwesomeIcon 
                                        icon={faTimes}
                                        title="取消"
                                    />
                                </span>
                                {
                                   withUnsavedMark &&
                                   <span className="rounded-circle unsaved-icon ms-2"></span> 
                                }
                            </a>
                        </li>
                    )
                })
            }
        </ul>
    );
}

TabList.propTypes = {
    files:PropTypes.array,
    activeId:PropTypes.string,
    unsaveIds:PropTypes.array,
    onTabClick:PropTypes.func,
    onCloseTab:PropTypes.func

}

TabList.defaultProps = {
    unsaveIds:[]
}