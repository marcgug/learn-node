import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  console.log('HEART ITTT');
  axios
    .post(this.action)
    .then(res => {
      console.log(res.data);
      const isHearted = this.heart.classList.toggle('heart__button--hearted');
      $('.heart-count').textContent = res.data.hearts.length;
      console.log(isHearted);
      if (isHearted) {
        this.heart.classList.add('heart__button--float');
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500)
      }
    })
    .catch(console.error);
}

export default ajaxHeart;