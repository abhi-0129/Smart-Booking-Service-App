import './ServiceCard.css';

const ServiceCard = ({ service, onBook, showBookButton = true }) => {
  const stars = Math.round(parseFloat(service.avg_rating) || 0);

  return (
    <div className="service-card fade-in">
      <div className="service-card-image">
        {service.image ? (
          <img src={service.image} alt={service.name} />
        ) : (
          <div className="service-card-no-image">📷</div>
        )}
        <span className="service-card-category">{service.category}</span>
      </div>
      <div className="service-card-body">
        <h3 className="service-card-name">{service.name}</h3>
        {service.provider_name && (
          <p className="service-card-provider">by {service.provider_name}</p>
        )}
        {service.description && (
          <p className="service-card-desc">{service.description}</p>
        )}
        <div className="service-card-meta">
          <div className="stars">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`star ${i <= stars ? 'filled' : ''}`}>★</span>
            ))}
            <span className="review-count">({service.review_count || 0})</span>
          </div>
          {service.duration_minutes && (
            <span className="service-duration">⏱ {service.duration_minutes}min</span>
          )}
        </div>
        <div className="service-card-footer">
          <span className="service-price">₹{parseFloat(service.price).toLocaleString('en-IN')}</span>
          {showBookButton && onBook && (
            <button className="btn btn-primary btn-sm" onClick={() => onBook(service)}>
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
