import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faBookOpen, faSearch, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import './header.css'

function Giangvien_Header() {
  return (
    <div className="header-container">
      <div className="left-section">
        <FontAwesomeIcon icon={faBars}  className="icon menu-icon" />
        <FontAwesomeIcon icon={faBookOpen} className="icon book-icon" />
      </div>

      <div className="search-section">
        <FontAwesomeIcon icon={faSearch} className=" icon search-icon" />
        <input type="search" placeholder="Tìm kiếm" className="search-input" />
      </div>

      <div className="right-section">
        <FontAwesomeIcon icon={faCirclePlus} className="icon plus-icon" />
        <button className="btn-upgrade">Nâng cấp tài khoản</button>
        <img src="/src/image/formimg.png" alt="avatar" className="avatar" />
      </div>
    </div>
  )
}

export default Giangvien_Header
