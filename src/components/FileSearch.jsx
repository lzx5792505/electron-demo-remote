import React, { useEffect, useState, useRef } from 'react';
import  PropTypes  from 'prop-types';
import useKeyPress from '../hooks/useKeyPress';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'

export default function FileSearch({ title, onFileSearch }) {
    const [ inputActive, setInputActive ] = useState(false)
    const [ value, setValue ] = useState('')
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    let nodes = useRef(null)

    const closeSearch = () => {
        onFileSearch('')
        setInputActive(false)
        setValue('')
    }

    useEffect(() =>{
        if(enterPressed && inputActive){
            onFileSearch(value)
        }
        if(escPressed && inputActive){
            closeSearch()
        }
    })

    useEffect(() => {
        if(inputActive){
            nodes.current.focus()
        }
    },[inputActive])

    // useEffect(() => {
    //     if(value.length === 0){
    //         closeAll()
    //     }
    // },[value])

    return (
        <div className="alert alert-primary d-flex justify-content-between align-items-center h-60 mb-0">
            {
                !inputActive && 
                <>
                    <span>{title}</span>
                    <button
                        type="button"
                        className="icon-button ms-2"
                        onClick={() => { setInputActive(true) }}
                    >
                        <FontAwesomeIcon 
                            size="lg"
                            icon={faSearch}
                            title="搜索"
                        />
                    </button>
                </>
            }
            {
               inputActive && 
               <>
                    <input 
                        type="text" 
                        className="form-control"
                        value={value}
                        ref={nodes}
                        onChange={(e) => { setValue(e.target.value) }}
                    />
                    <button
                       type="button"
                       className="icon-button ms-2"
                       onClick={ closeSearch }
                    >
                       <FontAwesomeIcon 
                            size="lg"
                            icon={faTimes}
                            title="关闭"
                        />
                   </button>
               </> 
            }
        </div>
    );
}

FileSearch.propTypes = {
    title:PropTypes.string,
    onFileSearch:PropTypes.func.isRequired
}

FileSearch.defaultProps = {
    title:'我的云文档'
}