import React from 'react';
import './Loader.scss'

export default function Loader({ text = '处理中...'}) {
    return (
        <div className='loading-componet text-center'>
            <div className="spinner-grow text-primary" role="status">
                <span className="visually-hidden">{ text }</span>
            </div>
            <h5 className="text-primary"> { text } </h5>
        </div>
    );
}

