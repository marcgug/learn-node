import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 8 
}

function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;

      if (!places.length) {
        alert('No places found :(');
        return;
      }

      // create a bound
      const bounds = new google.maps.LatLngBounds();

      const infoWindow = new google.maps.InfoWindow();


      // make markers
      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };

        bounds.extend(position);

        const marker = new google.maps.Marker({
          map: map,
          position: position
        })

        marker.place = place;

        return marker;
      });

      //attach event listener to each marker
      markers.forEach(marker => marker.addListener('click', function(){
        console.log(this);
        const html = `
          <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);

      }));

      // zoom it to bounds
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);

      console.log(markers);

    })
}

function makeMap(mapDiv) {
  //console.log(mapDiv);
  if (!mapDiv) return;

  // make the map
  const map = new google.maps.Map(mapDiv, mapOptions);
  
  // after map is loaded, load places on the map
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);

  // listen for changes to autocomplete
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
    console.log(place);

  });


}

export default makeMap;