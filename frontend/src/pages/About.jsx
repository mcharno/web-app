import { useTranslation } from 'react-i18next';
import './About.css';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <h2>About</h2>

      <p>{t('about.main')}</p>

      <ul>
        <li>{t('about.listItem1')}</li>
        <li>{t('about.listItem2')}</li>
        <li>{t('about.listItem3')}</li>
        <li>{t('about.listItem4')}</li>
        <li>{t('about.listItem5')}</li>
        <li>{t('about.listItem6')}</li>
      </ul>

      <p>{t('about.content1')}</p>
      <p dangerouslySetInnerHTML={{ __html: t('about.content2') }} />
      <p dangerouslySetInnerHTML={{ __html: t('about.content3') }} />
      <p dangerouslySetInnerHTML={{ __html: t('about.content4') }} />
    </div>
  );
};

export default About;
