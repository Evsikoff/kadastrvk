export class MapParser {
  static parseMapFile(fileContent) {
    const maps = [];
    
    // Разбиваем на блоки карт
    const mapBlocks = fileContent.split(/\/\/ MAP #\d+/);
    
    for (const block of mapBlocks) {
      if (!block.trim()) continue;
      
      // Извлекаем A_CODE
      const aCodeMatch = block.match(/const A_CODE = "([^"]+)"/);
      if (!aCodeMatch) continue;
      
      const aCode = aCodeMatch[1].split(',').map(num => parseInt(num.trim()));
      
      // Извлекаем REGION_MAP
      const regionMapMatch = block.match(/const REGION_MAP = \[([\s\S]*?)\];/);
      if (!regionMapMatch) continue;
      
      const regionMapStr = regionMapMatch[1];
      const rows = regionMapStr.match(/"[^"]+"/g);
      
      if (!rows) continue;
      
      const regionMap = rows.map(row => {
        const cleanRow = row.replace(/"/g, '');
        return cleanRow.split(',').map(num => parseInt(num.trim()));
      });
      
      maps.push({
        aCode,
        regionMap
      });
    }
    
    return maps;
  }
}
