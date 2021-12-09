import { useEffect, useRef } from 'react'

const { Menu, MenuItem, getCurrentWindow } = window.require('@electron/remote')

export default function useContextMenu( itemArr, targetSelector, deps ) {
    let clickElement = useRef(null)
    useEffect(() => {
        const menu =  new Menu()
        itemArr.forEach(item => {
            menu.append( new MenuItem(item) )
        });

        const handleContextMenu = (e) => {
            if(document.querySelector(targetSelector).contains(e.target)){
                clickElement.current =  e.target
                menu.popup({ window:getCurrentWindow() })
            }
        }
        window.addEventListener('contextmenu', handleContextMenu)
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    },deps)
    return clickElement
}