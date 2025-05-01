// Filters.jsx
import React from 'react';

const Filters = ({
  filterType, setFilterType,
  expirySoon, setExpirySoon,
  postTypeFilter, setPostTypeFilter,
  distanceRange, setDistanceRange
}) => {
  const handleTypeChange = (e) => {
    setFilterType(e.target.value);
  };

  const handleExpiryChange = (e) => {
    setExpirySoon(e.target.checked);
  };

  const handlePostTypeChange = (e) => {
    setPostTypeFilter(e.target.value);
  };

  const handleDistanceChange = (e) => {
    setDistanceRange(Number(e.target.value));
  };

  return (
    <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
      {/* Food Type Filter */}
      <select className="form-select w-auto" value={filterType} onChange={handleTypeChange}>
        <option value="">All Food Types</option>
        <option value="Fruits">Fruits</option>
        <option value="Meals">Meals</option>
        <option value="Bakery">Bakery</option>
        <option value="Vegetables">Vegetables</option>
      </select>

      {/* Post Type Filter */}
      <select className="form-select w-auto" value={postTypeFilter} onChange={handlePostTypeChange}>
        <option value="">All Posts</option>
        <option value="donation">Donations</option>
        <option value="request">Requests</option>
      </select>

      {/* Expiry Soon */}
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          checked={expirySoon}
          onChange={handleExpiryChange}
          id="expirySoon"
        />
        <label className="form-check-label" htmlFor="expirySoon">
          Expiring Soon (next 2 days)
        </label>
      </div>

      {/* Distance Filter */}
      <select className="form-select w-auto" value={distanceRange} onChange={handleDistanceChange}>
        <option value={0}>All Distances</option>
        <option value={5}>Within 5 km</option>
        <option value={10}>Within 10 km</option>
        <option value={20}>Within 20 km</option>
      </select>
    </div>
  );
};

export default Filters;
