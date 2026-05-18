import { Card, Muted, Screen, Title } from '../../src/components/ui';

export default function LegalScreen() {
  return (
    <Screen>
      <Title>Yasal Metinler</Title>
      <Card>
        <Muted>
          TanıLog tıbbi teşhis veya tedavi önerisi vermez. Uygulama içindeki AI çıktıları sadece sağlık kayıtlarını
          düzenlemeye ve doktor görüşmesine hazırlanma sürecine yardımcı olmak için kullanılır.
        </Muted>
      </Card>
      <Card>
        <Muted>
          Demo sürümünde gerçek sağlık belgesi yerine örnek veya anonimleştirilmiş veri kullanılması önerilir.
        </Muted>
      </Card>
    </Screen>
  );
}
