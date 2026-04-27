import { useNavigate } from 'react-router-dom'
import { CreateItemMasterModal } from '../components/itemMaster/CreateItemMasterModal'

export function ItemMasterAddPage() {
  const navigate = useNavigate()

  const handleClose = () => navigate('/app/item-master')
  const handleCreated = () => navigate('/app/item-master')

  return (
    <CreateItemMasterModal onClose={handleClose} onCreated={handleCreated} />
  )
}
