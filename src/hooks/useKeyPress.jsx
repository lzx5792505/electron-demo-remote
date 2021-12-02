import { useState, useEffect } from 'react';

export default function useKeyPress( targetKeyCode ) {
    const [ keyPressed, setkeyPressed ] = useState(false)

    useEffect(() => {
        const keyDownHandler = ({ keyCode }) => {
            keyStatus(keyCode, true)
        }

        const keyUpHandler = ({ keyCode }) => {
            keyStatus(keyCode, false)
        }

        const keyStatus = (keyCode, bool) => {
            if( keyCode === targetKeyCode ){
                setkeyPressed(bool)
            }
        }

        document.addEventListener('keydown',keyDownHandler)
        document.addEventListener('keyup',keyUpHandler)
        return () => {
            document.removeEventListener('keydown',keyDownHandler)
            document.removeEventListener('keyup',keyUpHandler)
        }
    },[targetKeyCode])

    return keyPressed
}