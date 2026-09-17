import React from 'react'
import {createRoot} from 'react-dom/client'
import LocalAdminShell from './local/LocalAdminShell'
import './index.css'
import './local/crm.css'
if (!['localhost','127.0.0.1','[::1]'].includes(location.hostname)) throw new Error('Aperçu réservé à cette machine')
createRoot(document.getElementById('root')).render(<LocalAdminShell/>);
