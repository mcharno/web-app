<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <html>
    <head>
    </head>
    <body>
    <h2>2011 League Table</h2>
      <table border="1">
        <tr>
          <th>Team</th>
          <th>Played</th>
          <th>Won</th>
          <th>Lost</th>
          <th>No Result</th>
          <th>Points</th>
        </tr>
        <xsl:for-each select="/fixtures/match">
          <xsl:apply-templates select="document(@file)/*" />
        </xsl:for-each>
      </table>
    </body>
    </html>
  </xsl:template>
        
  <xsl:template match="match">
      <tr>
        <td>
          <xsl:apply-templates select="day" /> - <xsl:apply-templates select="month" /> - <xsl:apply-templates select="year" />
        </td>
        <td>
          <xsl:apply-templates select="visitors/team" />
        </td>
        <td>
          <xsl:choose>
            <xsl:when test="visitors/boxscore">
              <a><xsl:attribute name="href"><xsl:value-of select="visitors/boxscore" /></xsl:attribute><xsl:apply-templates select="visitors/runs" />-<xsl:apply-templates select="visitors/wicketsLost" /></a>
            </xsl:when>
            <xsl:otherwise>
              <xsl:apply-templates select="visitors/runs" />-<xsl:apply-templates select="visitors/wicketsLost" />
            </xsl:otherwise>
          </xsl:choose>
        </td>
        <td rowspan="2">
          <xsl:apply-templates select="summary" />
        </td>
      </tr>
      <tr>
        <td>
          <xsl:apply-templates select="home/team" />
        </td>
        <td>
          <xsl:choose>
            <xsl:when test="home/boxscore">
              <a><xsl:attribute name="href"><xsl:value-of select="home/boxscore" /></xsl:attribute><xsl:apply-templates select="home/runs" />-<xsl:apply-templates select="home/wicketsLost" /></a>
            </xsl:when>
            <xsl:otherwise>
              <xsl:apply-templates select="home/runs" />-<xsl:apply-templates select="home/wicketsLost" />
            </xsl:otherwise>
          </xsl:choose>
        </td>
      </tr>
      
  </xsl:template>
  
  <xsl:template match="player">
    <li>
      <xsl:apply-templates select="surname" />: 
    </li>
  </xsl:template>
        
</xsl:stylesheet>